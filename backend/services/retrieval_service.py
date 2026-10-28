"""Pencarian pasal untuk chatbot: gabungan pencarian makna (vektor), kata kunci (BM25), dan pasal yang disebut langsung.

Alurnya:
1. Pasal yang disebut eksplisit ("Pasal 1365 KUHPerdata") diambil langsung dan ditaruh paling atas.
2. Kandidat dari pencarian vektor (RPC match_dokumen_hukum) dan kata kunci (BM25 di memori) digabung dengan
   Reciprocal Rank Fusion. Kata kunci menutup kelemahan vektor untuk istilah persis ("pesangon", "PKWT"), dan
   vektor menutup kelemahan kata kunci untuk pertanyaan awam.
3. Kandidat disaring: chunk "Cukup jelas" dibuang, Preambule dan definisi (Pasal 1) diturunkan, Penjelasan dipakai
   hanya kalau pasalnya sendiri tidak terambil, isi kembar dibuang, dan paling banyak satu potongan panduan.
4. Versi terbaru diutamakan memakai data/perubahan_peraturan.json.

Korpus teks (tanpa embedding) dimuat sekali per proses dan diperbarui tiap KORPUS_TTL_DETIK, sehingga pencarian
kata kunci tidak membutuhkan perubahan skema database.
"""

import json
import logging
import math
import re
import threading
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Optional

from supabase import Client

from helpers import penjelasan
from repositories import legal_document_repository

logger = logging.getLogger(__name__)

PERUBAHAN_PATH = Path(__file__).resolve().parent.parent / "data" / "perubahan_peraturan.json"

KORPUS_TTL_DETIK = 30 * 60
KOLOM_KORPUS = "id_dokumen,frbr_uri,nama_uu,nomor_uu,tahun_uu,kategori,status_hukum,pasal_bagian,judul_bab,isi_teks"

KANDIDAT_VEKTOR = 12
KANDIDAT_KATA_KUNCI = 12
# Lebih rendah dari ambang tampil sumber, karena kandidat masih disaring dan digabung dengan kata kunci.
MIN_SIMILARITY_KANDIDAT = 0.45
SIMILARITY_YAKIN = 0.55
RRF_K = 60
MAX_PANDUAN = 1

BOBOT_PERATURAN_DISEBUT = 1.5
BOBOT_PREAMBULE = 0.3
BOBOT_DEFINISI = 0.5
BOBOT_PENJELASAN = 0.6
BOBOT_DOKUMEN_DIGANTI = 0.7
MIN_KEMIRIPAN_VERSI = 0.2

BM25_K1 = 1.2
BM25_B = 0.75

KATA_DEFINISI = ("pengertian", "definisi", "apa itu", "apa yang dimaksud", "arti ", "artinya")

STOPWORDS = set(
    """
    ada adalah agar akan aku anda apa apakah atau atas bagaimana bagi bahwa bisa dalam dan dapat dari dengan di dia
    hal harus ini itu jika juga kalau kami kamu karena ke kepada maka mereka nya oleh pada para saja saya sebagai
    sebagaimana secara sedang sejak serta setiap sudah supaya tahun telah tentang terhadap tersebut tidak untuk
    yang ya gak ga nggak sih dong kak deh nih kok tolong mohon berapa siapa kapan mana
    pasal ayat huruf angka undang uu nomor no peraturan pemerintah ketentuan hukum dimaksud
    """.split()
)

# Nama populer peraturan -> frbr_uri. Urutan dalam list menentukan prioritas (versi terbaru dulu).
ALIAS_PERATURAN = {
    r"kuh\s*perdata|kuhper\b|burgerlijk|\bbw\b": ["/akn/id/act/t2-001"],
    r"kuhap": ["/akn/id/act/t1-004", "/akn/id/act/t1-003"],
    r"kuhp\b|kitab undang[- ]undang hukum pidana": ["/akn/id/act/t1-001"],
    r"\bite\b|informasi dan transaksi elektronik": ["/akn/id/act/uu-1-2024", "/akn/id/act/t1-008"],
    r"cipta kerja": ["/akn/id/act/t2-005"],
    r"ketenagakerjaan|uu naker": ["/akn/id/act/t2-005", "/akn/id/act/t2-004"],
    r"pkdrt|kdrt|kekerasan dalam rumah tangga": ["/akn/id/act/t1-005"],
    r"tpks|kekerasan seksual": ["/akn/id/act/t1-006"],
    r"perkawinan": ["/akn/id/act/t2-003", "/akn/id/act/t2-002"],
    r"perlindungan konsumen|uupk": ["/akn/id/act/t2-006"],
    r"\bpdp\b|data pribadi": ["/akn/id/act/t1-013"],
    r"narkotika": ["/akn/id/act/t2-009"],
    r"lalu lintas|\bllaj\b": ["/akn/id/act/t2-010"],
    r"tipikor|korupsi": ["/akn/id/act/t2-008", "/akn/id/act/t2-007"],
    r"\bbpjs\b": ["/akn/id/act/t2-011"],
    r"\bphi\b|perselisihan hubungan industrial": ["/akn/id/act/t2-012"],
    r"\bham\b|hak asasi manusia": ["/akn/id/act/t1-007"],
    r"pornografi": ["/akn/id/act/t1-012"],
    r"perdagangan orang|\btppo\b": ["/akn/id/act/t2-013"],
    r"\bkesehatan\b": ["/akn/id/act/t2-019"],
    r"rumah sakit": ["/akn/id/act/t2-020"],
    r"\bsppa\b|peradilan pidana anak": ["/akn/id/act/t4-005"],
    r"bantuan hukum": ["/akn/id/act/t4-006"],
    r"advokat": ["/akn/id/act/t4-011"],
    r"\bpers\b": ["/akn/id/act/t4-020"],
    r"\bkip\b|keterbukaan informasi": ["/akn/id/act/t4-008"],
    r"pelayanan publik": ["/akn/id/act/t4-015"],
    r"ombudsman": ["/akn/id/act/t4-007"],
    r"kepolisian": ["/akn/id/act/t4-009"],
    r"kejaksaan": ["/akn/id/act/t4-010"],
    r"\btppu\b|pencucian uang": ["/akn/id/act/t4-013"],
    r"agraria|\buupa\b": ["/akn/id/act/uu-5-1960"],
    r"pendaftaran tanah": ["/akn/id/act/t3-017"],
    r"kepailitan|\bpkpu\b": ["/akn/id/act/t4-002"],
    r"\bdesa\b": ["/akn/id/act/t4-018"],
    r"perumahan": ["/akn/id/act/t4-004"],
    r"serikat pekerja|serikat buruh": ["/akn/id/act/t2-015"],
    r"\bpkwt\b|alih daya": ["/akn/id/act/t3-001"],
}
_ALIAS_RE = [(re.compile(pola, re.I), frbrs) for pola, frbrs in ALIAS_PERATURAN.items()]
# Petunjuk tambahan yang hanya dipakai untuk menaikkan bobot, tidak untuk mencari nomor pasal langsung.
_PETUNJUK_RE = [(re.compile(r"\bperdata\b", re.I), ["/akn/id/act/t2-001"])]
_PASAL_DISEBUT = re.compile(r"\bpasal\s+(\d+[a-z]?)\b", re.I)
_NOMOR_UU = re.compile(r"\b(?:uu|undang[- ]undang)\s*(?:no\.?|nomor)?\s*(\d+)\s*(?:tahun|/)\s*(\d{4})", re.I)


def _tokens(teks: str) -> list[str]:
    return [_stem(t) for t in re.findall(r"[a-z0-9]+", teks.lower()) if t not in STOPWORDS and len(t) > 2]


_AWALAN = (
    "meng",
    "meny",
    "mem",
    "men",
    "me",
    "peng",
    "peny",
    "pem",
    "pen",
    "per",
    "pe",
    "ber",
    "ter",
    "di",
    "ke",
    "se",
)
# Akhiran "-i" sengaja tidak dibuang: banyak kata dasar berakhiran i ("curi", "beli").
_AKHIRAN = ("nya", "kan", "an")


@lru_cache(maxsize=100_000)
def _stem(kata: str) -> str:
    """Pemotong imbuhan sederhana supaya 'dicuri', 'pencurian', dan 'mencuri' bertemu di 'curi'.

    Hasilnya tidak selalu kata dasar yang benar, tetapi cukup karena query dan dokumen dipotong dengan cara sama.
    """
    for akhiran in _AKHIRAN:
        if kata.endswith(akhiran) and len(kata) - len(akhiran) >= 3:
            kata = kata[: -len(akhiran)]
            break
    for awalan in _AWALAN:
        if kata.startswith(awalan):
            # Awalan dicoba dari yang terpanjang; kalau sisanya terlalu pendek, berhenti (jangan coba awalan lebih
            # pendek), supaya "mencuri" tidak menjadi "ncuri".
            return kata[len(awalan) :] if len(kata) - len(awalan) >= 4 else kata
    return kata


# Padanan kata awam/modern -> istilah di naskah peraturan (terutama KUHPerdata yang bahasanya lama).
_SINONIM_MENTAH = {
    "perjanjian": ("persetujuan", "kontrak"),
    "melawan": ("melanggar",),
    "gaji": ("upah",),
    "karyawan": ("pekerja", "buruh"),
    "menikah": ("perkawinan",),
    "nikah": ("perkawinan",),
    "dipecat": ("pemutusan",),
    "bos": ("pengusaha",),
    "fitnah": ("pencemaran", "penghinaan"),
}
SINONIM = {_stem(k): tuple(_stem(v) for v in vs) for k, vs in _SINONIM_MENTAH.items()}


def _tokens_query(teks: str) -> list[str]:
    tokens = _tokens(teks)
    return tokens + [s for t in tokens for s in SINONIM.get(t, ())]


@dataclass
class _Korpus:
    rows: dict[int, dict] = field(default_factory=dict)
    postings: dict[str, list[tuple[int, int]]] = field(default_factory=dict)
    panjang: dict[int, int] = field(default_factory=dict)
    rata_panjang: float = 1.0
    per_pasal: dict[tuple[str, str], list[int]] = field(default_factory=lambda: defaultdict(list))
    per_nomor_uu: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    dimuat: float = 0.0


_korpus: Optional[_Korpus] = None
_kunci = threading.Lock()


def _tandai_penjelasan(rows: list[dict]) -> None:
    """Tandai chunk Penjelasan dan "Cukup jelas", termasuk data lama yang belum diberi label oleh script pembersihan."""
    per_dokumen = defaultdict(list)
    for r in rows:
        r["isi_teks"] = r.get("isi_teks") or ""
        per_dokumen[r["frbr_uri"]].append(r)
    for rs in per_dokumen.values():
        rs.sort(key=lambda r: r["id_dokumen"])
        awal = penjelasan.awal_penjelasan([(r["pasal_bagian"], r["isi_teks"]) for r in rs])
        for i, r in enumerate(rs):
            label = r.get("pasal_bagian") or ""
            r["_kosong"] = penjelasan.hanya_cukup_jelas(r["isi_teks"])
            r["_penjelasan"] = label.startswith("Penjelasan") or (awal is not None and i >= awal)
            nomor = label.replace("Penjelasan ", "").split("_")[0].strip()
            r["_label_pasal"] = nomor.lower()


def _muat_korpus(supabase: Client) -> _Korpus:
    mulai = time.monotonic()
    k = _bangun_korpus(legal_document_repository.list_all(supabase, KOLOM_KORPUS))
    logger.info(f"[RETRIEVAL] Korpus dimuat: {len(k.rows)} chunk, {len(k.postings)} kata ({k.dimuat - mulai:.1f}s)")
    return k


def _bangun_korpus(rows: list[dict]) -> _Korpus:
    _tandai_penjelasan(rows)
    k = _Korpus()
    for r in rows:
        if r["_kosong"]:
            continue
        k.rows[r["id_dokumen"]] = r
        tf = Counter(_tokens(f"{r.get('nama_uu') or ''} {r.get('pasal_bagian') or ''} {r['isi_teks']}"))
        k.panjang[r["id_dokumen"]] = sum(tf.values())
        for term, n in tf.items():
            k.postings.setdefault(term, []).append((r["id_dokumen"], n))
        if not r["_penjelasan"]:
            k.per_pasal[(r["frbr_uri"], r["_label_pasal"])].append(r["id_dokumen"])
        m = _NOMOR_UU.search(r.get("nomor_uu") or "")
        if m and r["frbr_uri"] not in k.per_nomor_uu[f"{m.group(1)}/{m.group(2)}"]:
            k.per_nomor_uu[f"{m.group(1)}/{m.group(2)}"].append(r["frbr_uri"])
    k.rata_panjang = sum(k.panjang.values()) / max(len(k.panjang), 1)
    k.dimuat = time.monotonic()
    return k


def _get_korpus(supabase: Client) -> Optional[_Korpus]:
    """Korpus untuk pencarian kata kunci, atau None kalau gagal dimuat (pencarian tetap jalan dengan vektor saja)."""
    global _korpus
    with _kunci:
        if _korpus is None or time.monotonic() - _korpus.dimuat > KORPUS_TTL_DETIK:
            try:
                _korpus = _muat_korpus(supabase)
            except Exception as e:
                logger.error(f"[RETRIEVAL] Korpus gagal dimuat, memakai pencarian vektor saja: {e}")
                return _korpus  # korpus lama (kalau ada) masih lebih baik daripada tidak ada
        return _korpus


def panaskan_korpus(supabase: Client) -> None:
    """Mulai memuat korpus di background kalau belum ada, supaya waktunya tumpang tindih dengan classifier."""
    if _korpus is None or time.monotonic() - _korpus.dimuat > KORPUS_TTL_DETIK:
        threading.Thread(target=_get_korpus, args=(supabase,), daemon=True).start()


def reset_korpus() -> None:
    """Paksa korpus dimuat ulang, misalnya setelah admin mengunggah atau mengubah dokumen."""
    global _korpus
    with _kunci:
        _korpus = None


def _relasi_perubahan() -> dict[str, dict]:
    try:
        relasi = json.loads(PERUBAHAN_PATH.read_text(encoding="utf-8"))["relasi"]
    except FileNotFoundError:
        return {}
    return {r["lama"]: r for r in relasi}


def _cari_kata_kunci(k: _Korpus, teks_query: str, jumlah: int) -> list[tuple[int, float]]:
    skor = defaultdict(float)
    n_dok = len(k.rows)
    for term in set(_tokens_query(teks_query)):
        postings = k.postings.get(term)
        if not postings:
            continue
        idf = math.log(1 + (n_dok - len(postings) + 0.5) / (len(postings) + 0.5))
        for id_dokumen, tf in postings:
            norm = BM25_K1 * (1 - BM25_B + BM25_B * k.panjang[id_dokumen] / k.rata_panjang)
            skor[id_dokumen] += idf * tf * (BM25_K1 + 1) / (tf + norm)
    return sorted(skor.items(), key=lambda x: -x[1])[:jumlah]


def _frbr_disebut(k: _Korpus, pertanyaan: str) -> list[str]:
    frbrs = []
    m = _NOMOR_UU.search(pertanyaan)
    if m:
        frbrs += k.per_nomor_uu.get(f"{m.group(1)}/{m.group(2)}", [])
    for pola, daftar in _ALIAS_RE:
        if pola.search(pertanyaan):
            frbrs += [f for f in daftar if f not in frbrs]
    return frbrs


def _cari_langsung(k: _Korpus, pertanyaan: str, teks_query: str) -> list[int]:
    """Pasal yang disebut nomornya bersama nama peraturannya, misalnya "Pasal 27 UU ITE"."""
    nomor = [n.lower() for n in _PASAL_DISEBUT.findall(pertanyaan)]
    if not nomor:
        return []
    hasil = []
    for frbr in _frbr_disebut(k, pertanyaan):
        for n in nomor:
            ids = k.per_pasal.get((frbr, f"pasal {n}"), [])
            if len(ids) > 1:
                # UU omnibus bisa punya beberapa pasal bernomor sama; pilih yang paling cocok dengan pertanyaan.
                peringkat = {i: s for i, s in _cari_kata_kunci(k, teks_query, len(k.rows))}
                ids = sorted(ids, key=lambda i: -peringkat.get(i, 0))[:1]
            hasil += [i for i in ids if i not in hasil]
        if hasil:
            break  # peraturan pertama yang punya pasal itu adalah versi yang paling diutamakan
    return hasil


def _kemiripan(a: str, b: str) -> float:
    ta, tb = set(_tokens(a)), set(_tokens(b))
    return len(ta & tb) / max(len(ta | tb), 1)


def _versi_baru(k: _Korpus, row: dict, relasi: dict) -> Optional[int]:
    rel = relasi.get(row["frbr_uri"])
    if not rel or rel["jenis"] != "diubah_sebagian":
        return None
    kandidat = k.per_pasal.get((rel["baru"], row["_label_pasal"]), [])
    terbaik = max(kandidat, key=lambda i: _kemiripan(row["isi_teks"], k.rows[i]["isi_teks"]), default=None)
    if terbaik is not None and _kemiripan(row["isi_teks"], k.rows[terbaik]["isi_teks"]) >= MIN_KEMIRIPAN_VERSI:
        return terbaik
    return None


def _hasil(row: dict, similarity: float, sumber: str, catatan: Optional[str] = None) -> dict:
    data = {key: v for key, v in row.items() if not key.startswith("_")}
    data.update({"similarity": round(similarity, 4), "sumber_cari": sumber, "catatan": catatan})
    data["penjelasan"] = row["_penjelasan"]
    data["yakin"] = sumber in ("langsung", "vektor+kata_kunci") or similarity >= SIMILARITY_YAKIN
    return data


def cari_pasal(
    supabase: Client,
    pertanyaan: str,
    query_pencarian: str,
    kategori: Optional[str] = None,
    jumlah: int = 3,
) -> list[dict]:
    """Pasal yang dikirim ke model untuk menjawab pertanyaan, sudah diurutkan dan disaring."""
    relasi = _relasi_perubahan()
    teks_query = f"{query_pencarian} {pertanyaan}"

    from services.rag_service import embed_query

    vektor = legal_document_repository.match_by_embedding(
        supabase,
        {
            "query_embedding": embed_query(query_pencarian or pertanyaan),
            "match_threshold": MIN_SIMILARITY_KANDIDAT,
            "match_count": KANDIDAT_VEKTOR,
            **({"filter_kategori": kategori} if kategori else {}),
        },
    )
    for r in vektor:
        r.setdefault("id_dokumen", r.get("id"))
    similarity = {r["id_dokumen"]: r.get("similarity", 0.0) for r in vektor}

    k = _get_korpus(supabase)
    if k is None:
        # Darurat: index kecil dari hasil vektor saja, supaya penyaringan dan urutan tetap berlaku.
        k = _bangun_korpus([{c: r.get(c) for c in KOLOM_KORPUS.split(",")} for r in vektor])
    kata_kunci = [i for i, _ in _cari_kata_kunci(k, teks_query, KANDIDAT_KATA_KUNCI)]
    if kategori:
        kata_kunci = [i for i in kata_kunci if k.rows[i].get("kategori") == kategori]

    skor = defaultdict(float)
    for daftar in (list(similarity), kata_kunci):
        for peringkat, id_dokumen in enumerate(daftar):
            if id_dokumen in k.rows:
                skor[id_dokumen] += 1 / (RRF_K + peringkat + 1)

    tanya_definisi = any(kata in pertanyaan.lower() for kata in KATA_DEFINISI)
    disebut = set(_frbr_disebut(k, teks_query))
    disebut |= {f for pola, daftar in _PETUNJUK_RE if pola.search(teks_query) for f in daftar}
    for id_dokumen in skor:
        row = k.rows[id_dokumen]
        if row["frbr_uri"] in disebut:
            skor[id_dokumen] *= BOBOT_PERATURAN_DISEBUT
        if row.get("pasal_bagian") == "Preambule":
            skor[id_dokumen] *= BOBOT_PREAMBULE
        elif row["_label_pasal"] == "pasal 1" and not tanya_definisi:
            skor[id_dokumen] *= BOBOT_DEFINISI
        if row["_penjelasan"]:
            skor[id_dokumen] *= BOBOT_PENJELASAN
        rel = relasi.get(row["frbr_uri"])
        if rel and rel["jenis"] in ("diganti", "dicabut"):
            skor[id_dokumen] *= BOBOT_DOKUMEN_DIGANTI

    langsung = _cari_langsung(k, pertanyaan, teks_query)
    urutan = langsung + [i for i, _ in sorted(skor.items(), key=lambda x: -x[1]) if i not in langsung]

    terpilih: list[dict] = []
    sudah_pasal, sudah_isi = set(), set()
    panduan = 0

    def tambah(id_dokumen: int, sumber: str, catatan: Optional[str] = None) -> bool:
        nonlocal panduan
        row = k.rows[id_dokumen]
        kunci_pasal = (row.get("nomor_uu") or row["frbr_uri"], row["_label_pasal"], row["_penjelasan"])
        kunci_isi = re.sub(r"\s+", " ", penjelasan.isi_tanpa_judul(row["isi_teks"]))[:200]
        is_panduan = "/proc-" in row["frbr_uri"]
        if (
            kunci_pasal in sudah_pasal
            or kunci_isi in sudah_isi
            or (is_panduan and panduan >= MAX_PANDUAN)
            # Penjelasan tidak perlu kalau bunyi pasalnya sudah terambil.
            or (row["_penjelasan"] and (kunci_pasal[0], kunci_pasal[1], False) in sudah_pasal)
        ):
            return False
        sudah_pasal.add(kunci_pasal)
        sudah_isi.add(kunci_isi)
        panduan += is_panduan
        hasil = _hasil(row, similarity.get(id_dokumen, 0.0), sumber, catatan)
        kunci_penjelasannya = (kunci_pasal[0], kunci_pasal[1], True)
        if not row["_penjelasan"] and kunci_penjelasannya in sudah_pasal:
            # Penjelasan pasal ini sudah terambil lebih dulu: ganti dengan bunyi pasalnya di posisi yang sama.
            for i, p in enumerate(terpilih):
                if p["penjelasan"] and (p.get("nomor_uu") or p["frbr_uri"]) == kunci_pasal[0]:
                    if p["pasal_bagian"].lower().replace("penjelasan ", "").split("_")[0] == kunci_pasal[1]:
                        terpilih[i] = hasil
                        return True
        terpilih.append(hasil)
        return True

    for id_dokumen in urutan:
        if len(terpilih) >= jumlah:
            break
        row = k.rows[id_dokumen]
        if id_dokumen in langsung:
            sumber = "langsung"
        elif id_dokumen in similarity and id_dokumen in kata_kunci:
            sumber = "vektor+kata_kunci"
        else:
            sumber = "vektor" if id_dokumen in similarity else "kata_kunci"

        rel = relasi.get(row["frbr_uri"])
        baru = _versi_baru(k, row, relasi)
        if baru is not None and baru != id_dokumen:
            # Versi terbaru dimasukkan lebih dulu; versi lama tetap boleh ikut sebagai pembanding.
            tambah(baru, sumber, "Versi terbaru dari pasal ini.")
            if len(terpilih) >= jumlah:
                break
            tambah(id_dokumen, sumber, f"Versi lama. {rel['catatan']}")
        elif rel and rel["jenis"] in ("diganti", "dicabut"):
            tambah(id_dokumen, sumber, f"Kemungkinan sudah tidak berlaku. {rel['catatan']}")
        else:
            tambah(id_dokumen, sumber)

    logger.info(
        f"[RETRIEVAL] {len(terpilih)} pasal: "
        + ", ".join(f"{p['frbr_uri'].rsplit('/', 1)[-1]}:{p['pasal_bagian']}({p['sumber_cari']})" for p in terpilih)
    )
    return terpilih
