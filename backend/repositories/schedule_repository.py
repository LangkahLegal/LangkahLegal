from supabase import Client

TABLE = "jadwal_ketersediaan"


def list_available_between(db: Client, konsultan_ids: list[int], mulai: str, sampai: str) -> list[dict]:
    """Jadwal terbuka beberapa konsultan sekaligus dalam rentang tanggal (YYYY-MM-DD, inklusif)."""
    if not konsultan_ids:
        return []
    return (
        db.table(TABLE)
        .select("id_jadwal, id_konsultan, tanggal, jam_mulai, jam_selesai")
        .in_("id_konsultan", konsultan_ids)
        .eq("status_tersedia", True)
        .gte("tanggal", mulai)
        .lte("tanggal", sampai)
        .order("tanggal")
        .order("jam_mulai")
        .execute()
        .data
        or []
    )


def get_by_id(db: Client, id_jadwal: int, columns: str = "*") -> dict | None:
    rows = db.table(TABLE).select(columns).eq("id_jadwal", id_jadwal).execute().data
    return rows[0] if rows else None


def list_available(db: Client, id_konsultan: int) -> list[dict]:
    return db.table(TABLE).select("*").eq("id_konsultan", id_konsultan).eq("status_tersedia", True).execute().data


def list_available_by_date(db: Client, id_konsultan: int) -> list[dict]:
    return (
        db.table(TABLE)
        .select("id_jadwal, tanggal, jam_mulai, jam_selesai, status_tersedia")
        .eq("id_konsultan", id_konsultan)
        .eq("status_tersedia", True)
        .order("tanggal")
        .execute()
        .data
    )


def list_with_clients(db: Client, id_konsultan: int) -> list[dict]:
    return (
        db.table(TABLE)
        .select(
            """
        id_jadwal, tanggal, jam_mulai, jam_selesai, status_tersedia,
        pengajuan_konsultasi ( users ( nama ) )
    """
        )
        .eq("id_konsultan", id_konsultan)
        .execute()
        .data
    )


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def update(db: Client, id_jadwal: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_jadwal", id_jadwal).execute().data


def set_available(db: Client, id_jadwal: int, available: bool) -> list[dict]:
    return update(db, id_jadwal, {"status_tersedia": available})


def delete(db: Client, id_jadwal: int) -> None:
    db.table(TABLE).delete().eq("id_jadwal", id_jadwal).execute()
