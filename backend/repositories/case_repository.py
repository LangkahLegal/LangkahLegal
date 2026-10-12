from supabase import Client

TABLE = "bursa_kasus"
DEFAULT_KATEGORI = "umum"


def get_by_id(db: Client, id_bursa: int, columns: str = "*") -> dict | None:
    rows = db.table(TABLE).select(columns).eq("id_bursa", id_bursa).execute().data
    return rows[0] if rows else None


def list_by_status(
    db: Client,
    status_bursa: str,
    kategori: str | None = None,
    offset: int | None = None,
    limit: int | None = None,
) -> tuple[list[dict], int | None]:
    query = db.table(TABLE).select("*", count="exact").eq("status_bursa", status_bursa)

    if kategori == DEFAULT_KATEGORI:
        query = query.or_(f"kategori_hukum.eq.{DEFAULT_KATEGORI},kategori_hukum.is.null")
    elif kategori:
        query = query.eq("kategori_hukum", kategori)

    query = query.order("id_bursa", desc=True)
    if limit is not None:
        query = query.range(offset or 0, (offset or 0) + limit - 1)

    result = query.execute()
    return result.data or [], result.count


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def update(db: Client, id_bursa: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_bursa", id_bursa).execute().data
