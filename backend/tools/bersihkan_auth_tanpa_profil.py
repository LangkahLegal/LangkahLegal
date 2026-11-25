"""Temukan atau hapus akun Supabase Auth tanpa profil public.users.

Default hanya menampilkan ID/email. Tambahkan --hapus untuk menghapus akun orphan.
"""

import argparse

from core.database import get_supabase_client
from repositories import user_repository


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hapus", action="store_true", help="Hapus akun Auth tanpa profil")
    args = parser.parse_args()
    db = get_supabase_client()

    page = 1
    total = 0
    while True:
        response = db.auth.admin.list_users(page=page, per_page=100)
        users = response if isinstance(response, list) else getattr(response, "users", [])
        if not users:
            break
        for user in users:
            if user_repository.list_by_auth_user_id(db, user.id, "id_user"):
                continue
            total += 1
            print(f"ORPHAN auth_user_id={user.id} email={user.email or '-'}")
            if args.hapus:
                db.auth.admin.delete_user(user.id)
                print(f"DIHAPUS auth_user_id={user.id}")
        if len(users) < 100:
            break
        page += 1

    print(f"Total orphan: {total}; mode: {'hapus' if args.hapus else 'dry-run'}")


if __name__ == "__main__":
    main()
