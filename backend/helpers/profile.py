from supabase import Client

from repositories import user_repository


def find_profile(db: Client, auth_user_id: str, email: str | None, columns: str) -> dict | None:
    """
    Cari profil lokal milik akun Supabase Auth. Jika belum tertaut tetapi ada
    profil dengan email yang sama, tautkan lalu kembalikan profil tersebut.
    """
    profiles = user_repository.list_by_auth_user_id(db, auth_user_id, columns)
    if profiles:
        return profiles[0]

    if not email:
        return None

    email_profiles = user_repository.list_by_email(db, email, columns)
    if not email_profiles:
        return None

    user_repository.link_auth_user(db, email, auth_user_id)
    return {**email_profiles[0], "auth_user_id": auth_user_id}
