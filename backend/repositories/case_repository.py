from supabase import Client

TABLE = "bursa_kasus"


def get_by_id(db: Client, id_bursa: int, columns: str = "*") -> dict | None:
    rows = db.table(TABLE).select(columns).eq("id_bursa", id_bursa).execute().data
    return rows[0] if rows else None


def list_by_status(db: Client, status_bursa: str) -> list[dict]:
    return db.table(TABLE).select("*").eq("status_bursa", status_bursa).execute().data


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def update(db: Client, id_bursa: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_bursa", id_bursa).execute().data
