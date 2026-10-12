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


def list_active_catalog(
    db: Client,
    spesialisasi: Optional[str] = None,
    search: Optional[str] = None,
    verified: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    offset: Optional[int] = None,
    limit: Optional[int] = None,
) -> tuple[list[dict], int | None]:
    query = (
        db.table(TABLE)
        .select(
            """
            id_konsultan,
            nama_lengkap,
            spesialisasi,
            is_active,
            status_verifikasi,
            tarif_per_sesi,
            users (foto_profil),
            rating_ulasan (skor_rating)
        """,
            count="exact",
        )
        .eq("is_active", True)
    )

    if spesialisasi:
        query = query.ilike("spesialisasi", f"%{spesialisasi}%")
    if search:
        query = query.or_(f"nama_lengkap.ilike.%{search}%,spesialisasi.ilike.%{search}%")
    if verified is True:
        query = query.eq("status_verifikasi", "terverifikasi")
    elif verified is False:
        query = query.or_("status_verifikasi.neq.terverifikasi,status_verifikasi.is.null")
    if min_price is not None:
        query = query.gte("tarif_per_sesi", min_price)
    if max_price is not None:
        query = query.or_(f"tarif_per_sesi.lte.{max_price},tarif_per_sesi.is.null")

    query = query.order("id_konsultan")
    if limit is not None:
        query = query.range(offset or 0, (offset or 0) + limit - 1)

    result = query.execute()
    return result.data or [], result.count


def count(db: Client, status_verifikasi: str | None = None) -> int:
    query = db.table(TABLE).select("id_konsultan", count="exact")
    if status_verifikasi:
        query = query.eq("status_verifikasi", status_verifikasi)
    return query.limit(1).execute().count or 0


def list_for_admin(
    db: Client,
    status_verifikasi: Optional[str] = None,
    spesialisasi: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    query = db.table(TABLE).select("""
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

    if status_verifikasi:
        query = query.eq("status_verifikasi", status_verifikasi)

    if spesialisasi:
        query = query.ilike("spesialisasi", f"%{spesialisasi}%")

    if search:
        query = query.or_(f"nama_lengkap.ilike.%{search}%,spesialisasi.ilike.%{search}%")

    return query.order("updated_at", desc=True).execute().data


def update_by_id(db: Client, id_konsultan: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_konsultan", id_konsultan).execute().data


def update_by_user(db: Client, id_user: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_user", id_user).execute().data


def search_by_category(db: Client, params: dict) -> list[dict]:
    return db.rpc("search_consultants_by_category", params).execute().data or []


def is_active(db: Client, id_konsultan: int) -> bool:
    row = get_by_id(db, id_konsultan, "is_active")
    return bool(row and row.get("is_active"))


def exists(db: Client, id_konsultan: int) -> bool:
    return get_by_id(db, id_konsultan, "id_konsultan") is not None


def get_owner(db: Client, id_konsultan: int) -> dict:
    return get_by_id_strict(db, id_konsultan, "id_user, nama_lengkap")


def get_name(db: Client, id_konsultan: int) -> dict:
    return get_by_id_strict(db, id_konsultan, "nama_lengkap")


def get_public_detail(db: Client, id_konsultan: int) -> dict | None:
    return get_by_id(db, id_konsultan, "*, users(nama, email, foto_profil), rating_ulasan(skor_rating)")


def get_admin_detail(db: Client, id_konsultan: int) -> dict | None:
    return get_by_id(
        db,
        id_konsultan,
        """
            *,
            users (id_user, nama, email, foto_profil, created_at),
            rating_ulasan (skor_rating, ulasan_teks, created_at)
        """,
    )
