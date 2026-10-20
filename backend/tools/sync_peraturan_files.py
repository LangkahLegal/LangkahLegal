"""Cari naskah resmi setiap dokumen knowledge base di JDIH BPK, verifikasi, lalu simpan ke Cloudinary.

Jalankan manual dari folder backend:

    python tools/sync_peraturan_files.py --cache-dir <folder kosong untuk unduhan>
    python tools/sync_peraturan_files.py --cache-dir <...> --only /akn/id/act/t2-004 --dry-run

Alurnya per dokumen:
1. Cari halaman detail di peraturan.bpk.go.id lewat filter nomor, tahun, dan jenis, lalu cocokkan slug-nya.
2. Unduh PDF resmi dari halaman detail itu.
3. Verifikasi: bandingkan teks PDF dengan pasal yang sudah ada di tabel dokumen_hukum. PDF yang isinya
   tidak cocok tidak diupload, karena berarti metadata dokumen di database keliru.
4. Upload ke Cloudinary sebagai raw file (batas paket Free 10 MB, PDF lebih besar dikompres dulu).
5. Tulis hasilnya ke data/peraturan_files.json, yang dibaca backend saat runtime.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from urllib.parse import quote, unquote

import fitz
import httpx
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
sys.path.insert(0, str(BACKEND_DIR))

from core.database import get_supabase_client  # noqa: E402

MANIFEST_PATH = BACKEND_DIR / "data" / "peraturan_files.json"
BPK = "https://peraturan.bpk.go.id"
UA = {"User-Agent": "Mozilla/5.0 (LangkahLegal knowledge sync; kontak langkahlegal@gmail.com)"}
CLOUDINARY_FOLDER = "langkahlegal/peraturan"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
JEDA_DETIK = 1.5
SKOR_COCOK = 0.25
MIN_TEKS_PDF = 3000

# Kode filter "jenis" di form pencarian JDIH BPK.
UU, PP, PERMA, INPRES, PERMEN = "8", "10", "95", "13", "15"


@dataclass(frozen=True)
class Spec:
    frbr_uri: str
    jenis: str
    prefix: str
    nomor: str
    tahun: int
    # Path /Details/... yang sudah dicek manual, untuk peraturan yang tidak muncul lewat filter pencarian BPK.
    detail: str | None = None


# frbr_uri -> peraturan yang dicari. Dokumen "proc-*" adalah panduan buatan sendiri, tidak punya naskah resmi.
SPECS = [
    Spec("/akn/id/act/t1-001", UU, "uu", "1", 2023),
    Spec("/akn/id/act/t1-003", UU, "uu", "8", 1981),
    Spec("/akn/id/act/t1-004", UU, "uu", "20", 2025),
    Spec("/akn/id/act/t1-005", UU, "uu", "23", 2004),
    Spec("/akn/id/act/t1-006", UU, "uu", "12", 2022),
    Spec("/akn/id/act/t1-007", UU, "uu", "39", 1999),
    Spec("/akn/id/act/t1-008", UU, "uu", "19", 2016),
    Spec("/akn/id/act/t1-011", UU, "uu", "26", 2000),
    Spec("/akn/id/act/t1-012", UU, "uu", "44", 2008),
    Spec("/akn/id/act/t1-013", UU, "uu", "27", 2022),
    Spec("/akn/id/act/t2-002", UU, "uu", "1", 1974),
    Spec("/akn/id/act/t2-003", UU, "uu", "16", 2019),
    Spec("/akn/id/act/t2-004", UU, "uu", "13", 2003),
    Spec("/akn/id/act/t2-005", UU, "uu", "6", 2023),
    Spec("/akn/id/act/t2-006", UU, "uu", "8", 1999),
    Spec("/akn/id/act/t2-007", UU, "uu", "31", 1999),
    Spec("/akn/id/act/t2-008", UU, "uu", "20", 2001),
    Spec("/akn/id/act/t2-009", UU, "uu", "35", 2009),
    Spec("/akn/id/act/t2-010", UU, "uu", "22", 2009),
    Spec("/akn/id/act/t2-011", UU, "uu", "24", 2011),
    Spec("/akn/id/act/t2-012", UU, "uu", "2", 2004),
    Spec("/akn/id/act/t2-013", UU, "uu", "21", 2007),
    Spec("/akn/id/act/t2-014", UU, "uu", "31", 2014),
    Spec("/akn/id/act/t2-015", UU, "uu", "21", 2000),
    Spec("/akn/id/act/t2-016", UU, "uu", "40", 2004),
    Spec("/akn/id/act/t2-019", UU, "uu", "17", 2023),
    Spec("/akn/id/act/t2-020", UU, "uu", "44", 2009),
    Spec("/akn/id/act/t2-021", UU, "uu", "8", 2016),
    Spec("/akn/id/act/t3-001", PP, "pp", "35", 2021),
    Spec("/akn/id/act/t3-002", PP, "pp", "36", 2021),
    Spec("/akn/id/act/t3-003", PP, "pp", "43", 2018),
    Spec("/akn/id/act/t3-004", PP, "pp", "71", 2019),
    Spec("/akn/id/act/t3-005", PP, "pp", "27", 2024),
    Spec("/akn/id/act/t3-006", PP, "pp", "17", 2025),
    Spec("/akn/id/act/t3-007", PERMA, "perma", "1", 2016),
    Spec("/akn/id/act/t3-008", PERMA, "perma", "4", 2019),
    Spec("/akn/id/act/t3-009", PERMA, "perma", "7", 2022),
    Spec("/akn/id/act/t3-010", PP, "pp", "55", 2025),
    Spec("/akn/id/act/t3-011", PP, "pp", "4", 2006),
    Spec("/akn/id/act/t3-012", PERMA, "perma", "2", 2012),
    Spec("/akn/id/act/t3-013", PERMA, "perma", "3", 2017),
    Spec("/akn/id/act/t3-014", PP, "pp", "65", 2015),
    Spec("/akn/id/act/t3-016", PERMA, "perma", "5", 2019),
    Spec("/akn/id/act/t3-017", PP, "pp", "24", 1997),
    Spec("/akn/id/act/t3-018", PERMEN, "permen", "6", 2018, "/Details/103713/permen-agrariakepala-bpn-no-6-tahun-2018"),
    Spec("/akn/id/act/t3-019", PP, "pp", "128", 2015),
    Spec("/akn/id/act/t3-022", PP, "pp", "17", 2025),
    Spec("/akn/id/act/t3-023", PP, "pp", "47", 2021),
    Spec("/akn/id/act/t3-024", PERMEN, "permen", "24", 2022, "/Details/245544/permenkes-no-24-tahun-2022"),
    Spec("/akn/id/act/t3-025", PP, "pp", "70", 2019),
    Spec("/akn/id/act/t3-026", PP, "pp", "43", 2004),
    Spec("/akn/id/act/t4-001", UU, "uu", "27", 2022),
    Spec("/akn/id/act/t4-002", UU, "uu", "37", 2004),
    Spec("/akn/id/act/t4-003", UU, "uu", "5", 1960),
    Spec("/akn/id/act/t4-004", UU, "uu", "1", 2011),
    Spec("/akn/id/act/t4-005", UU, "uu", "11", 2012),
    Spec("/akn/id/act/t4-006", UU, "uu", "16", 2011),
    Spec("/akn/id/act/t4-007", UU, "uu", "37", 2008),
    Spec("/akn/id/act/t4-008", UU, "uu", "14", 2008),
    Spec("/akn/id/act/t4-009", UU, "uu", "2", 2002),
    Spec("/akn/id/act/t4-010", UU, "uu", "11", 2021),
    Spec("/akn/id/act/t4-011", UU, "uu", "18", 2003),
    Spec("/akn/id/act/t4-012", UU, "uu", "50", 2009),
    Spec("/akn/id/act/t4-013", UU, "uu", "8", 2010),
    Spec("/akn/id/act/t4-014", UU, "uu", "40", 2008),
    Spec("/akn/id/act/t4-015", UU, "uu", "25", 2009),
    Spec("/akn/id/act/t4-016", UU, "uu", "5", 1960),
    Spec(
        "/akn/id/act/t4-017",
        INPRES,
        "inpres",
        "1",
        1991,
        "/Details/293351/inpres-no-1-tahun-1991-penyebarluasan-kompilasi-hukum-islam",
    ),
    Spec("/akn/id/act/t4-018", UU, "uu", "6", 2014),
    Spec("/akn/id/act/t4-019", UU, "uu", "31", 1997),
    Spec("/akn/id/act/t4-020", UU, "uu", "40", 1999),
    Spec("/akn/id/act/uu-1-1946", UU, "uu", "1", 1946),
    Spec("/akn/id/act/uu-1-2024", UU, "uu", "1", 2024),
    Spec("/akn/id/act/uu-3-2025", UU, "uu", "3", 2025),
    Spec("/akn/id/act/uu-5-1960", UU, "uu", "5", 1960),
    # Dua dokumen ini tersimpan dengan nomor kosong/0; isinya dikenali dari judul di database.
    Spec("/akn/id/act/uu-0-0", UU, "uu", "1", 2024),
    Spec("/akn/id/act/uu--0", UU, "uu", "1", 2025),
]


def log(msg: str) -> None:
    print(msg, flush=True)


def _http() -> httpx.Client:
    return httpx.Client(headers=UA, timeout=120, follow_redirects=True)


def find_detail(client: httpx.Client, spec: Spec) -> str | None:
    """Kembalikan path /Details/<id>/<slug> yang slug-nya cocok persis dengan nomor dan tahun."""
    if spec.detail:
        return spec.detail
    pola = re.compile(rf"^/Details/\d+/{spec.prefix}[a-z0-9-]*-no-{spec.nomor}-tahun-{spec.tahun}$")
    queries = [
        {"nomor": spec.nomor, "tahun": str(spec.tahun), "jenis": spec.jenis},
        {"nomor": spec.nomor, "tahun": str(spec.tahun)},
    ]
    for params in queries:
        html = client.get(f"{BPK}/Search", params=params).text
        time.sleep(JEDA_DETIK)
        kandidat = sorted(set(re.findall(r'href="(/Details/\d+/[^"]+)"', html)))
        cocok = [k for k in kandidat if pola.match(k)]
        if cocok:
            return cocok[0]
    return None


def read_detail(client: httpx.Client, detail_path: str) -> tuple[str, list[str]]:
    html = client.get(f"{BPK}{detail_path}").text
    time.sleep(JEDA_DETIK)
    judul = unescape(re.search(r"<title>(.*?)</title>", html, re.S).group(1)).replace(" - JDIH BPK", "").strip()
    unduhan = list(dict.fromkeys(re.findall(r'href="(/Download/\d+/[^"]+\.pdf)"', html, re.I)))
    return judul, unduhan


def download(client: httpx.Client, path: str, cache_dir: Path) -> bytes:
    nama = re.sub(r"[^A-Za-z0-9._-]", "_", unquote(path.split("/", 2)[2]))
    target = cache_dir / nama
    if target.exists():
        return target.read_bytes()
    url = f"{BPK}{quote(unquote(path))}"
    resp = client.get(url)
    time.sleep(JEDA_DETIK)
    resp.raise_for_status()
    if not resp.content.startswith(b"%PDF"):
        raise ValueError(f"Bukan PDF: {url}")
    target.write_bytes(resp.content)
    return resp.content


def _norm_words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _shingles(words: list[str], n: int = 6) -> set[tuple[str, ...]]:
    return {tuple(words[i : i + n]) for i in range(len(words) - n + 1)}


def pdf_text(pdf: bytes) -> tuple[str, int]:
    doc = fitz.open(stream=pdf, filetype="pdf")
    return "\n".join(page.get_text() for page in doc), doc.page_count


def kb_sample(db, frbr_uri: str) -> str:
    rows = (
        db.table("dokumen_hukum")
        .select("isi_teks")
        .eq("frbr_uri", frbr_uri)
        .order("id_dokumen")
        .limit(30)
        .execute()
        .data
    )
    return "\n".join(r["isi_teks"][:1500] for r in rows)


def kb_nama(db, frbr_uri: str) -> str:
    rows = db.table("dokumen_hukum_summary").select("nama_uu").eq("frbr_uri", frbr_uri).limit(1).execute().data
    return rows[0]["nama_uu"] if rows else ""


def verify(kb_text: str, teks_pdf: str) -> tuple[str, float]:
    if len(teks_pdf.strip()) < MIN_TEKS_PDF:
        return "pindaian", 0.0
    kb = _shingles(_norm_words(kb_text))
    if not kb:
        return "kb_kosong", 0.0
    skor = len(kb & _shingles(_norm_words(teks_pdf))) / len(kb)
    return ("cocok" if skor >= SKOR_COCOK else "tidak_cocok"), round(skor, 3)


def judul_cocok(nama_uu: str, judul_bpk: str) -> bool:
    """Cadangan untuk PDF pindaian yang teksnya tidak bisa dibandingkan: nama pendek di KB harus muncul di judul BPK."""
    kata = [w for w in _norm_words(nama_uu) if len(w) >= 5]
    judul = set(_norm_words(judul_bpk))
    return bool(kata) and all(w in judul for w in kata)


# Tahap kompresi dicoba berurutan sampai muat: tanpa mengurangi kualitas, lalu gambar halaman diperkecil.
# 96 dpi masih terbaca jelas untuk naskah peraturan, dan lapisan teksnya tidak ikut berubah.
TAHAP_KOMPRESI = (None, (96, 45), (72, 40))


def shrink(pdf: bytes) -> bytes:
    for tahap in TAHAP_KOMPRESI:
        doc = fitz.open(stream=pdf, filetype="pdf")
        if tahap:
            dpi, kualitas = tahap
            doc.rewrite_images(dpi_threshold=dpi + 10, dpi_target=dpi, quality=kualitas)
        hasil = doc.tobytes(garbage=4, deflate=True, clean=True)
        if len(hasil) <= MAX_UPLOAD_BYTES:
            return hasil
    return hasil


def upload(pdf: bytes, slug: str) -> dict:
    cloud = os.environ["CLOUDINARY_CLOUD_NAME"]
    key = os.environ["CLOUDINARY_API_KEY"]
    secret = os.environ["CLOUDINARY_API_SECRET"]
    params = {
        "public_id": f"{CLOUDINARY_FOLDER}/{slug}.pdf",
        "overwrite": "true",
        "timestamp": str(int(time.time())),
    }
    to_sign = "&".join(f"{k}={params[k]}" for k in sorted(params)) + secret
    params["signature"] = hashlib.sha1(to_sign.encode()).hexdigest()
    params["api_key"] = key
    resp = httpx.post(
        f"https://api.cloudinary.com/v1_1/{cloud}/raw/upload",
        data=params,
        files={"file": (f"{slug}.pdf", pdf, "application/pdf")},
        timeout=300,
    )
    body = resp.json()
    if resp.status_code != 200:
        raise RuntimeError(body.get("error", {}).get("message", resp.text[:200]))
    return body


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {}


def save_manifest(manifest: dict) -> None:
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    ordered = dict(sorted(manifest.items()))
    MANIFEST_PATH.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def process(spec: Spec, client: httpx.Client, db, cache_dir: Path, uploaded: dict, dry_run: bool) -> dict:
    detail = find_detail(client, spec)
    if not detail:
        return {"status": "tidak_ditemukan"}
    slug = detail.rsplit("/", 1)[1]
    judul, unduhan = read_detail(client, detail)
    entry = {"judul": judul, "slug": slug, "bpk_url": f"{BPK}{detail}", "download_url": None, "file_url": None}
    if not unduhan:
        return {**entry, "status": "tanpa_pdf"}

    pdf = download(client, unduhan[0], cache_dir)
    entry["download_url"] = f"{BPK}{quote(unquote(unduhan[0]))}"
    teks, halaman = pdf_text(pdf)
    status, skor = verify(kb_sample(db, spec.frbr_uri), teks)
    if status in ("pindaian", "kb_kosong"):
        status = f"{status}_judul_cocok" if judul_cocok(kb_nama(db, spec.frbr_uri), judul) else "tidak_cocok"
    entry.update({"halaman": halaman, "verifikasi": status, "skor": skor})
    if status == "tidak_cocok":
        return {**entry, "status": "isi_tidak_cocok"}

    if len(pdf) > MAX_UPLOAD_BYTES:
        pdf = shrink(pdf)
    entry["bytes"] = len(pdf)
    if len(pdf) > MAX_UPLOAD_BYTES:
        return {**entry, "status": "terlalu_besar"}
    if dry_run:
        return {**entry, "status": "siap_upload"}

    if slug not in uploaded:
        uploaded[slug] = upload(pdf, slug)["secure_url"]
    entry["file_url"] = uploaded[slug]
    return {**entry, "status": "terupload"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--cache-dir", required=True, type=Path)
    parser.add_argument("--only", action="append", help="frbr_uri tertentu saja (boleh berulang)")
    parser.add_argument("--dry-run", action="store_true", help="cari, unduh, verifikasi, tanpa upload")
    args = parser.parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)

    db = get_supabase_client()
    manifest = load_manifest()
    uploaded = {v["slug"]: v["file_url"] for v in manifest.values() if v.get("file_url")}
    specs = [s for s in SPECS if not args.only or s.frbr_uri in args.only]

    hasil: dict[str, int] = {}
    with _http() as client:
        for i, spec in enumerate(specs, 1):
            try:
                entry = process(spec, client, db, args.cache_dir, uploaded, args.dry_run)
            except Exception as e:
                entry = {"status": "error", "error": f"{type(e).__name__}: {str(e)[:200]}"}
            hasil[entry["status"]] = hasil.get(entry["status"], 0) + 1
            log(
                f"[{i:02}/{len(specs)}] {entry['status']:<16} {spec.frbr_uri:<24} "
                f"{entry.get('judul', '')[:60]} skor={entry.get('skor', '-')}"
            )
            # Galat sementara (jaringan, BPK sibuk) tidak boleh menghapus hasil yang sudah ada sebelumnya.
            if not args.dry_run and not (entry["status"] == "error" and spec.frbr_uri in manifest):
                manifest[spec.frbr_uri] = entry
                save_manifest(manifest)

    log(f"\nRingkasan: {hasil}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
