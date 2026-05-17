"""
Document Processing Service
============================
Logika modular untuk memproses PDF dokumen hukum:
  1. Ekstraksi teks dari PDF (PyMuPDF/fitz)
  2. OCR noise cleaning
  3. Chunking per pasal
  4. AI metadata extraction (Gemini)
  5. Embedding batch (Voyage AI) dengan rate-limit handling
  6. Upsert ke Supabase

Dipindahkan dari tests/rag_test.py dan tests/scrapper_fast.py
agar bisa dipakai oleh router admin_docs.
"""

import os
import re
import json
import time
import logging
from pathlib import Path

import fitz  # PyMuPDF
import voyageai
from google import genai
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

log = logging.getLogger(__name__)

EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIM = 1024
MIN_CHUNK_LEN = 30
MAX_CHARS_PER_BATCH = 10_000
BATCH_DELAY_SECONDS = 21.0  # Voyage free tier: ~3 RPM


OCR_NOISE_PATTERNS = [
    r"^##\s*\[HALAMAN\s+\d+\]\s*$",
    r"^-\s*\d+\s*-$",
    r"^SALINAN$",
    r"^DIUNDANGKAN.*$",
    r"^LEMBARAN NEGARA.*$",
    r"^TAMBAHAN LEMBARAN.*$",
    r"^NOMOR\s+\d+.*$",
    r"^SK\s+NO\s+\w+.*$",
    r"^(PRESIDEN|PEESIDEN|FRESIDEN|PTIESIDEN|REFIJEUK|REPUELIK|REPUBUK|REPUBL|NEPUEUK)\b.*$",
]

_NOISE_RE = re.compile("|".join(OCR_NOISE_PATTERNS), re.IGNORECASE)


def _is_noise_line(line: str) -> bool:
    """Deteksi apakah baris ini noise (watermark, header, footer, sampah OCR)."""
    s = line.strip()
    if not s:
        return True
    if _NOISE_RE.search(s):
        return True

    alnum = sum(1 for c in s if c.isalnum())
    symbols = sum(1 for c in s if not c.isalnum() and not c.isspace())
    letters = [c for c in s if c.isalpha()]
    vowels = sum(1 for c in letters if c.lower() in "aiueo")

    if len(s) <= 18 and (alnum == 0 or (symbols / max(len(s), 1)) > 0.35):
        return True
    legal_prefixes = ("BAB ", "BAGIAN ", "PARAGRAF ", "PASAL ", "UNDANG-UNDANG", "PERATURAN")
    if len(letters) >= 8 and vowels <= 1 and s.upper() == s and not s.startswith(legal_prefixes):
        return True
    if re.search(r"(.)\1{4,}", s):
        return True

    return False


def _normalize_lines(raw: str) -> str:
    """Bersihkan noise per baris dan gabung ulang."""
    lines = []
    for line in raw.splitlines():
        s = line.strip()
        if not s or _is_noise_line(s):
            continue
        s = re.sub(r"\s{3,}", "  ", s)
        lines.append(s)
    return "\n".join(lines)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Ekstrak teks dari PDF bytes menggunakan PyMuPDF (fitz)."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    all_parts = []

    for page in doc:
        blocks = page.get_text("blocks")
        page_lines = []
        for block in blocks:
            text = (block[4] or "").strip()
            if not text:
                continue
            for raw_line in text.splitlines():
                line = raw_line.strip()
                if line and not _is_noise_line(line):
                    page_lines.append(line)
        if page_lines:
            all_parts.append("\n".join(page_lines))

    full = _normalize_lines("\n\n".join(all_parts))

    if len(full.strip()) < 100:
        log.warning("[DOC_SERVICE] Teks hasil ekstraksi sangat sedikit (<100 chars).")

    return full


def clean_ocr_text(raw: str) -> str:
    """Bersihkan teks OCR dari typo umum dan noise."""
    # Fix OCR typos
    raw = re.sub(r"Pasa[7l]\s*", "Pasal ", raw)
    raw = re.sub(r"(Pasal\s+\d+)\s*[Il]", r"\1 1", raw, flags=re.I)
    raw = re.sub(r"(Pasal\s+\d+)\s*[O]", r"\1 0", raw, flags=re.I)

    replacements = {
        "Tindal ": "Tindak ",
        "Pidatna": "Pidana",
        "REFIJEUK": "REPUBLIK",
        "PTIESIDEN": "PRESIDEN",
        "REPUBUK": "REPUBLIK",
    }
    for old, new in replacements.items():
        raw = raw.replace(old, new)

    text = _normalize_lines(raw.replace("\x00", ""))
    text = re.sub(r"\((\d)l\)", r"(\1)", text)
    text = re.sub(r"\(l(\d)\)", r"(\1)", text)
    return text.strip()


def split_into_chunks(text: str) -> list[dict]:
    """Pecah teks bersih menjadi chunk per-pasal."""
    pasal_re = re.compile(r"(?m)^Pasal\s+(\d+[a-z]?A?B?C?)\s*$", re.IGNORECASE)
    matches = list(pasal_re.finditer(text))

    if not matches:
        # Coba pattern tanpa trailing newline strict
        pasal_re = re.compile(r"(?m)^Pasal\s+(\d+[a-z]?A?B?C?)", re.IGNORECASE)
        matches = list(pasal_re.finditer(text))

    if not matches:
        return [{"nomor_pasal": "1_FULL_DOC", "teks": text}]

    chunks = []
    starts = [m.start() for m in matches] + [len(text)]

    # Preambule
    preamble = text[: starts[0]].strip()
    if len(preamble) >= MIN_CHUNK_LEN:
        chunks.append({"nomor_pasal": "PREAMBULE", "teks": preamble})

    seen: dict[str, int] = {}
    for i, m in enumerate(matches):
        num_raw = m.group(1)
        body = text[starts[i] : starts[i + 1]].strip()
        if len(body) < MIN_CHUNK_LEN:
            continue

        key = num_raw.lower()
        if key in seen:
            seen[key] += 1
            num = f"{num_raw}_{seen[key]}"
        else:
            seen[key] = 1
            num = num_raw

        chunks.append({"nomor_pasal": num, "teks": body})

    return chunks


AI_METADATA_PROMPT = """Kamu adalah ahli hukum Indonesia. Dari teks dokumen hukum berikut, ekstrak metadata dalam format JSON SAJA (tanpa markdown, tanpa backtick):

{
  "nama_uu": "Nama lengkap undang-undang",
  "nomor_uu": "Contoh: UU No. 1 Tahun 2024",
  "tahun_uu": 2024,
  "kategori": "salah satu dari: pidana, perdata, agama, umum, ketenagakerjaan, perusahaan, konsumen, pajak, internasional, tata_usaha_negara, lingkungan, hak_asasi_manusia, kesehatan, teknologi_informasi, kekayaan_intelektual, maritim, agraria, lainnya",
  "status_hukum": "berlaku atau informasi",
  "frbr_uri": "/akn/id/act/uu-NOMOR-TAHUN (contoh: /akn/id/act/uu-1-2024)"
}

Jawab HANYA JSON murni. Tidak boleh ada teks lain sebelum atau sesudah JSON.

TEKS DOKUMEN (500 karakter pertama):
"""

VALID_KATEGORI = {
    "pidana", "perdata", "agama", "umum", "ketenagakerjaan", "perusahaan",
    "konsumen", "pajak", "internasional", "tata_usaha_negara", "lingkungan",
    "hak_asasi_manusia", "kesehatan", "teknologi_informasi",
    "kekayaan_intelektual", "maritim", "agraria", "lainnya",
}


def extract_metadata_with_ai(full_text: str) -> dict:
    """Gunakan Gemini untuk mengekstrak metadata dari teks dokumen hukum."""
    client = genai.Client()
    preview = full_text[:2000]
    prompt = AI_METADATA_PROMPT + preview

    # Fallback models, mirip rag_service
    models = ["gemini-2.5-flash", "gemini-2.0-flash"]
    response_text = None

    for model in models:
        try:
            log.info(f"[DOC_SERVICE] Mencoba AI metadata extraction dengan {model}...")
            resp = client.models.generate_content(model=model, contents=prompt)
            response_text = resp.text.strip()
            break
        except Exception as e:
            if "429" in str(e):
                log.warning(f"[DOC_SERVICE] Model {model} rate-limited, coba fallback...")
                continue
            raise

    if not response_text:
        raise RuntimeError("Semua model AI terkena rate limit untuk metadata extraction.")

    # Parse JSON dari response (bersihkan markdown wrapper jika ada)
    cleaned = response_text
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        meta = json.loads(cleaned)
    except json.JSONDecodeError:
        log.error(f"[DOC_SERVICE] Gagal parse JSON dari AI: {cleaned[:200]}")
        raise ValueError(f"AI mengembalikan format bukan JSON valid: {cleaned[:100]}")

    # Validasi kategori
    if meta.get("kategori") not in VALID_KATEGORI:
        log.warning(f"[DOC_SERVICE] Kategori '{meta.get('kategori')}' tidak valid, fallback ke 'lainnya'")
        meta["kategori"] = "lainnya"

    return meta


def build_records(chunks: list[dict], metadata: dict) -> list[dict]:
    """Bangun list record siap-insert dari chunks + metadata AI."""
    frbr_uri = metadata.get("frbr_uri", "/akn/id/act/unknown")
    kategori = metadata.get("kategori", "lainnya")
    nama_uu = metadata.get("nama_uu")
    nomor_uu = metadata.get("nomor_uu")
    tahun_uu = metadata.get("tahun_uu")
    status_hukum = metadata.get("status_hukum", "berlaku")

    records = []
    for chunk in chunks:
        pasal = chunk["nomor_pasal"]
        node_id = str(pasal)
        records.append({
            "frbr_uri": frbr_uri,
            "node_id": node_id,
            "node_type": "pasal" if pasal != "1_FULL_DOC" else "chunk",
            "kategori": kategori,
            "nama_uu": nama_uu,
            "nomor_uu": nomor_uu,
            "tahun_uu": tahun_uu,
            "status_hukum": status_hukum,
            "sumber_undang_undang": nomor_uu or nama_uu or "unknown",
            "pasal_bagian": "Preambule" if pasal == "PREAMBULE" else f"Pasal {pasal}",
            "judul_bab": chunk.get("judul_bab"),
            "isi_teks": chunk["teks"],
        })
    return records


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=5, max=65),
    retry=retry_if_exception_type(Exception),
)
def _embed_batch_with_retry(client: voyageai.Client, texts: list[str]) -> list[list[float]]:
    """Embed satu batch teks, dengan retry pada 429."""
    try:
        resp = client.embed(texts, model=EMBEDDING_MODEL, input_type="document")
        return resp.embeddings
    except Exception as e:
        if "429" in str(e):
            log.warning("[DOC_SERVICE] Voyage 429 rate limit, retrying via exponential backoff...")
        raise


def generate_embeddings(texts: list[str], batch_delay: float = BATCH_DELAY_SECONDS) -> list[list[float]]:
    """Embed batch teks dengan dynamic chunking dan rate-limit handling."""
    client = voyageai.Client()
    all_embeddings = []

    # Dynamic batching berdasarkan character count
    batches: list[list[str]] = []
    current_batch: list[str] = []
    current_chars = 0

    for t in texts:
        # Potong teks yang terlalu panjang
        if len(t) > MAX_CHARS_PER_BATCH:
            t = t[:MAX_CHARS_PER_BATCH]
        if current_chars + len(t) > MAX_CHARS_PER_BATCH or len(current_batch) >= 120:
            batches.append(current_batch)
            current_batch = [t]
            current_chars = len(t)
        else:
            current_batch.append(t)
            current_chars += len(t)

    if current_batch:
        batches.append(current_batch)

    total = len(batches)
    for i, batch in enumerate(batches):
        log.info(f"[DOC_SERVICE] Embedding batch {i + 1}/{total} ({len(batch)} teks)...")
        embs = _embed_batch_with_retry(client, batch)
        all_embeddings.extend(embs)
        if i + 1 < total:
            log.info(f"[DOC_SERVICE] Menunggu {batch_delay}s sebelum batch berikutnya (rate limit)...")
            time.sleep(batch_delay)

    return all_embeddings


def process_pdf_to_records(pdf_bytes: bytes, manual_metadata: dict | None = None) -> tuple[list[dict], dict]:
    """
    Pipeline lengkap: PDF bytes → records siap insert.
    Jika manual_metadata disupply, lewati tahap ekstraksi AI.
    Returns (records_tanpa_embedding, metadata).
    """
    # 1. Extract
    log.info("[DOC_SERVICE] Step 1/4: Ekstraksi teks dari PDF...")
    raw_text = extract_text_from_pdf(pdf_bytes)
    if not raw_text or len(raw_text.strip()) < 50:
        raise ValueError("PDF tidak mengandung teks yang cukup untuk diproses.")

    # 2. Clean
    log.info("[DOC_SERVICE] Step 2/4: Membersihkan noise OCR...")
    cleaned = clean_ocr_text(raw_text)

    # 3. Metadata
    if manual_metadata:
        log.info("[DOC_SERVICE] Step 3/4: Menggunakan metadata manual (bypass AI)...")
        metadata = manual_metadata
    else:
        log.info("[DOC_SERVICE] Step 3/4: Mengekstrak metadata via AI...")
        metadata = extract_metadata_with_ai(cleaned)
        
    log.info(f"[DOC_SERVICE] Metadata: {metadata.get('nama_uu')} | {metadata.get('kategori')}")

    # 4. Chunk
    log.info("[DOC_SERVICE] Step 4/4: Chunking per pasal...")
    chunks = split_into_chunks(cleaned)
    if not chunks:
        chunks = [{"nomor_pasal": "1_FULL_DOC", "teks": cleaned[:MAX_CHARS_PER_BATCH]}]

    log.info(f"[DOC_SERVICE] Ditemukan {len(chunks)} chunk/pasal.")

    records = build_records(chunks, metadata)
    return records, metadata
