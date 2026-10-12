from typing import Optional

from supabase import Client

TABLE = "dokumen_hukum"
SUMMARY_VIEW = "dokumen_hukum_summary"


def _search_filter(search: str) -> str:
    return f"pasal_bagian.ilike.%{search}%,isi_teks.ilike.%{search}%"


def get_by_id(db: Client, id_dokumen: int, columns: str) -> dict | None:
    rows = db.table(TABLE).select(columns).eq("id_dokumen", id_dokumen).execute().data
    return rows[0] if rows else None


def get_first_by_uri(db: Client, frbr_uri: str, columns: str) -> tuple[dict | None, int]:
    result = (
        db.table(TABLE)
        .select(columns, count="exact")
        .eq("frbr_uri", frbr_uri)
        .order("id_dokumen")
        .limit(1)
        .execute()
    )
    return (result.data[0] if result.data else None), (result.count or 0)


def count_by_uri(db: Client, frbr_uri: str, search: Optional[str] = None) -> int:
    query = db.table(TABLE).select("id_dokumen", count="exact").eq("frbr_uri", frbr_uri)
    if search:
        query = query.or_(_search_filter(search))
    return query.execute().count or 0


def list_by_uri(
    db: Client,
    frbr_uri: str,
    columns: str,
    offset: int,
    limit: int,
    search: Optional[str] = None,
) -> list[dict]:
    query = db.table(TABLE).select(columns).eq("frbr_uri", frbr_uri)
    if search:
        query = query.or_(_search_filter(search))
    return query.order("id_dokumen").range(offset, offset + limit - 1).execute().data or []


def list_by_uri_with_count(
    db: Client,
    frbr_uri: str,
    columns: str,
    offset: int,
    limit: int,
    search: Optional[str] = None,
) -> tuple[list[dict], int]:
    query = db.table(TABLE).select(columns, count="exact").eq("frbr_uri", frbr_uri)
    if search:
        query = query.or_(_search_filter(search))
    result = query.order("id_dokumen").range(offset, offset + limit - 1).execute()
    return (result.data or []), (result.count or 0)


def list_summaries(
    db: Client,
    offset: int,
    limit: int,
    kategori: Optional[str] = None,
    search: Optional[str] = None,
) -> tuple[list[dict], int]:
    query = db.table(SUMMARY_VIEW).select(
        "frbr_uri, nama_uu, nomor_uu, tahun_uu, kategori, status_hukum, total_chunks", count="exact"
    )

    if kategori:
        query = query.eq("kategori", kategori)
    if search:
        query = query.ilike("nama_uu", f"%{search}%")

    result = query.order("frbr_uri").range(offset, offset + limit - 1).execute()
    return (result.data or []), (result.count or 0)


def insert_many(db: Client, rows: list[dict]) -> None:
    db.table(TABLE).insert(rows).execute()


def update(db: Client, id_dokumen: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_dokumen", id_dokumen).execute().data


def delete_by_uri(db: Client, frbr_uri: str) -> None:
    db.table(TABLE).delete().eq("frbr_uri", frbr_uri).execute()


def match_by_embedding(db: Client, params: dict) -> list[dict]:
    return db.rpc("match_dokumen_hukum", params).execute().data or []


def list_statuses_by_uris(db: Client, frbr_uris: list[str]) -> list[dict]:
    return (
        db.table(SUMMARY_VIEW)
        .select("frbr_uri, status_hukum")
        .in_("frbr_uri", frbr_uris)
        .execute()
        .data
        or []
    )
