"""Isi ulang dokumen knowledge base dari naskah resmi JDIH BPK. Jalankan manual dari folder backend:

    python tools/ingest_ulang_dokumen.py --frbr /akn/id/act/t2-016 --dry-run   # lihat hasil potong per pasal
    python tools/ingest_ulang_dokumen.py --frbr /akn/id/act/t2-016 --frbr /akn/id/act/t2-021

Dipakai untuk dokumen yang isinya salah (metadata menunjuk peraturan A, isinya peraturan B) atau hanya berisi
Preambule. URL PDF diambil dari data/peraturan_files.json (hasil tools/sync_peraturan_files.py). Metadata
(nama, nomor, kategori) dipertahankan dari baris yang sudah ada.

Embedding dibuat lewat Voyage; dengan batas akun gratis (3 request/menit) satu UU bisa makan beberapa menit.
"""

import argparse
import json
import sys
from pathlib import Path

import httpx

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from core.database import get_supabase_client  # noqa: E402
from repositories import legal_document_repository  # noqa: E402
from services.doc_processing import generate_embeddings, process_pdf_to_records  # noqa: E402

MANIFEST_PATH = BACKEND_DIR / "data" / "peraturan_files.json"
UA = {"User-Agent": "Mozilla/5.0 (LangkahLegal knowledge sync; kontak langkahlegal@gmail.com)"}
INSERT_BATCH = 40
KOLOM_METADATA = ("frbr_uri", "nama_uu", "nomor_uu", "tahun_uu", "kategori", "status_hukum")


def metadata_lama(db, frbr_uri: str) -> dict:
    rows = db.table("dokumen_hukum").select(",".join(KOLOM_METADATA)).eq("frbr_uri", frbr_uri).limit(1).execute().data
    if not rows:
        raise SystemExit(f"{frbr_uri} tidak ada di knowledge base")
    meta = rows[0]
    meta["status_hukum"] = (meta.get("status_hukum") or "berlaku").lower()
    return meta


def unduh_pdf(frbr_uri: str) -> bytes:
    entry = json.loads(MANIFEST_PATH.read_text(encoding="utf-8")).get(frbr_uri) or {}
    url = entry.get("download_url")
    if not url:
        raise SystemExit(f"{frbr_uri} belum punya download_url di {MANIFEST_PATH.name}")
    print(f"  unduh {url}")
    resp = httpx.get(url, headers=UA, follow_redirects=True, timeout=120)
    resp.raise_for_status()
    return resp.content


def proses(db, frbr_uri: str, dry_run: bool) -> None:
    print(f"\n== {frbr_uri}")
    meta = metadata_lama(db, frbr_uri)
    records, _ = process_pdf_to_records(unduh_pdf(frbr_uri), manual_metadata=meta)
    penjelasan = sum(1 for r in records if r["pasal_bagian"].startswith("Penjelasan"))
    print(f"  {meta['nama_uu']} ({meta['nomor_uu']}): {len(records)} chunk, {penjelasan} di antaranya Penjelasan")
    for r in records[:4] + records[-2:]:
        print(f"    {r['pasal_bagian']:24s} | {' '.join(r['isi_teks'].split())[:90]}")
    if dry_run:
        return

    embeddings = generate_embeddings([r["isi_teks"] for r in records])
    rows = [{**r, "embedding": e} for r, e in zip(records, embeddings)]
    lama = legal_document_repository.count_by_uri(db, frbr_uri)
    legal_document_repository.delete_by_uri(db, frbr_uri)
    for i in range(0, len(rows), INSERT_BATCH):
        legal_document_repository.insert_many(db, rows[i : i + INSERT_BATCH])
    print(f"  diganti: {lama} chunk lama -> {len(rows)} chunk baru")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--frbr", action="append", required=True, help="frbr_uri dokumen (boleh berulang)")
    parser.add_argument(
        "--dry-run", action="store_true", help="unduh dan potong saja, tanpa embedding dan tanpa menulis"
    )
    args = parser.parse_args()
    db = get_supabase_client()
    for frbr_uri in args.frbr:
        proses(db, frbr_uri, args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
