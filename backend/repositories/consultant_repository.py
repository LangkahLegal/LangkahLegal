from typing import Optional

from supabase import Client

TABLE = "konsultan"


def get_id_by_user(db: Client, id_user: int) -> int | None:
    rows = db.table(TABLE).select("id_konsultan").eq("id_user", id_user).limit(1).execute().data
    return rows[0]["id_konsultan"] if rows else None


def get_by_user_strict(db: Client, id_user: int, columns: str = "*") -> dict:
    return db.table(TABLE).select(columns).eq("id_user", id_user).single().execute().data


def get_by_id_strict(db: Client, id_konsultan: int, columns: str = "*") -> dict:
    return db.table(TABLE).select(columns).eq("id_konsultan", id_konsultan).single().execute().data


def get_by_id(db: Client, id_konsultan: int, columns: str = "*") -> dict | None:
    rows = db.table(TABLE).select(columns).eq("id_konsultan", id_konsultan).execute().data
    return rows[0] if rows else None


def list_active_catalog(db: Client, spesialisasi: Optional[str] = None) -> list[dict]:
    query = (
        db.table(TABLE)
        .select("""
            id_konsultan,
            nama_lengkap,
            spesialisasi,
            is_active,
            status_verifikasi,
            tarif_per_sesi,
            users (foto_profil),
            rating_ulasan (skor_rating)
        """)
        .eq("is_active", True)
    )

    if spesialisasi:
        query = query.ilike("spesialisasi", f"%{spesialisasi}%")

    return query.execute().data


def list_verification_statuses(db: Client) -> list[dict]:
    return db.table(TABLE).select("id_konsultan, status_verifikasi").execute().data


def list_for_admin(
    db: Client,
    status_verifikasi: Optional[str] = None,
    spesialisasi: Optional[str] = None,
) -> list[dict]:
    query = (
        db.table(TABLE)
        .select("""
            id_konsultan,
            nama_lengkap,
            spesialisasi,
            tarif_per_sesi,
            is_active,
            status_verifikasi,
            created_at,
            updated_at,
            pengalaman_tahun,
            kota_praktik,
            users (id_user, nama, email, foto_profil)
        """)
    )

    if status_verifikasi:
        query = query.eq("status_verifikasi", status_verifikasi)

    if spesialisasi:
        query = query.ilike("spesialisasi", f"%{spesialisasi}%")

    return query.order("updated_at", desc=True).execute().data


def update_by_id(db: Client, id_konsultan: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_konsultan", id_konsultan).execute().data


def update_by_user(db: Client, id_user: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_user", id_user).execute().data


def search_by_category(db: Client, params: dict) -> list[dict]:
    return db.rpc("search_consultants_by_category", params).execute().data or []
