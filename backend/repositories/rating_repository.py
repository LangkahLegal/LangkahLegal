from supabase import Client

TABLE = "rating_ulasan"


def list_by_pengajuan(db: Client, id_pengajuan: int) -> list[dict]:
    return db.table(TABLE).select("id_rating").eq("id_pengajuan", id_pengajuan).execute().data


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data
