from supabase import Client

TABLE = "dokumen_bursa"


def list_by_bursa(db: Client, id_bursa: int) -> list[dict]:
    return (
        db.table(TABLE)
        .select("id_dokumen, nama_dokumen, file_path, tipe_file, ukuran_kb, created_at")
        .eq("id_bursa", id_bursa)
        .order("created_at", desc=False)
        .execute()
        .data
        or []
    )


def has_any(db: Client, id_bursa: int) -> bool:
    rows = db.table(TABLE).select("id_dokumen").eq("id_bursa", id_bursa).limit(1).execute().data
    return bool(rows)


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def delete_by_bursa(db: Client, id_bursa: int) -> None:
    db.table(TABLE).delete().eq("id_bursa", id_bursa).execute()
