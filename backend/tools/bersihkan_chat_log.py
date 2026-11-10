"""Hapus log chatbot yang lebih tua dari N hari dari bucket log. Jalankan manual dari folder backend:

    python tools/bersihkan_chat_log.py --hari 30 --dry-run    # lihat folder tanggal yang akan dihapus
    python tools/bersihkan_chat_log.py --hari 30              # hapus

Log sudah tersamar, tetapi tetap berisi cerita kasus klien, jadi sebaiknya tidak disimpan selamanya.
Struktur bucket: {yyyy}/{mm}/{dd}/{session_id}/{HHMMSS}-{request_id}.json
"""

import argparse
import sys
from datetime import date, timedelta
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from core.config import get_settings  # noqa: E402
from core.database import get_supabase_client  # noqa: E402

BATAS_LIST = 1000
BATAS_HAPUS = 100


def _isi(bucket, path: str) -> list[str]:
    return [item["name"] for item in bucket.list(path, {"limit": BATAS_LIST})]


def _folder_tanggal(bucket):
    for tahun in _isi(bucket, ""):
        for bulan in _isi(bucket, tahun):
            for hari in _isi(bucket, f"{tahun}/{bulan}"):
                try:
                    tanggal = date(int(tahun), int(bulan), int(hari))
                except ValueError:
                    continue
                yield tanggal, f"{tahun}/{bulan}/{hari}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--hari", type=int, default=30, help="simpan log N hari terakhir (default 30)")
    parser.add_argument("--dry-run", action="store_true", help="hanya tampilkan, jangan hapus")
    args = parser.parse_args()

    bucket = get_supabase_client().storage.from_(get_settings().supabase_chat_log_bucket)
    batas = date.today() - timedelta(days=args.hari)
    total = 0
    for tanggal, folder in _folder_tanggal(bucket):
        if tanggal >= batas:
            continue
        files = [f"{folder}/{sesi}/{f}" for sesi in _isi(bucket, folder) for f in _isi(bucket, f"{folder}/{sesi}")]
        total += len(files)
        print(f"{folder}: {len(files)} file{' (dry-run)' if args.dry_run else ''}")
        if not args.dry_run:
            for i in range(0, len(files), BATAS_HAPUS):
                bucket.remove(files[i : i + BATAS_HAPUS])

    print(f"{'Akan dihapus' if args.dry_run else 'Dihapus'}: {total} file log lebih tua dari {batas}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
