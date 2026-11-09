"""Buat bucket privat untuk log chatbot (SUPABASE_CHAT_LOG_BUCKET, default "chat-logs"). Jalankan sekali dari
folder backend:

    python tools/siapkan_bucket_chat_log.py

Aman dijalankan ulang: kalau bucket sudah ada, script hanya memastikan bucket itu tidak publik.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from core.config import get_settings  # noqa: E402
from core.database import get_supabase_client  # noqa: E402


def main() -> int:
    nama = get_settings().supabase_chat_log_bucket
    storage = get_supabase_client().storage
    ada = {b.name: b for b in storage.list_buckets()}

    if nama not in ada:
        storage.create_bucket(nama, options={"public": False})
        print(f"Bucket '{nama}' dibuat (privat).")
        return 0
    if ada[nama].public:
        print(f"PERINGATAN: bucket '{nama}' sudah ada dan PUBLIK. Ubah jadi privat di dashboard Supabase.")
        return 1
    print(f"Bucket '{nama}' sudah ada dan privat.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
