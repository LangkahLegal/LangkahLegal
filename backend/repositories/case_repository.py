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
    search: str | None = None,
    tanggal_dari: str | None = None,
    tanggal_sampai: str | None = None,
    jam_dari: str | None = None,
    jam_sebelum: str | None = None,
    ada_dokumen: bool | None = None,
    urutan: list[tuple[str, bool]] | None = None,
    offset: int | None = None,
    limit: int | None = None,
) -> tuple[list[dict], int | None]:
    """`urutan` berisi pasangan (kolom, menurun); bawaan: kasus terbaru lebih dulu."""
    query = db.table(TABLE).select("*", count="exact").eq("status_bursa", status_bursa)

    if kategori == DEFAULT_KATEGORI:
        query = query.or_(f"kategori_hukum.eq.{DEFAULT_KATEGORI},kategori_hukum.is.null")
    elif kategori:
        query = query.eq("kategori_hukum", kategori)

    if search:
        query = query.ilike("deskripsi_kasus_awam", f"%{search}%")
    if tanggal_dari:
        query = query.gte("tanggal_konsultasi", tanggal_dari)
    if tanggal_sampai:
        query = query.lte("tanggal_konsultasi", tanggal_sampai)
    if jam_dari:
        query = query.gte("jam_mulai", jam_dari)
    if jam_sebelum:
        query = query.lt("jam_mulai", jam_sebelum)
    if ada_dokumen is True:
        query = query.not_.is_("dokumen_bukti", "null").neq("dokumen_bukti", "")
    elif ada_dokumen is False:
        query = query.or_("dokumen_bukti.is.null,dokumen_bukti.eq.")

    for column, descending in urutan or [("id_bursa", True)]:
        query = query.order(column, desc=descending)
    if limit is not None:
        query = query.range(offset or 0, (offset or 0) + limit - 1)

    result = query.execute()
    return result.data or [], result.count


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def update(db: Client, id_bursa: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_bursa", id_bursa).execute().data
