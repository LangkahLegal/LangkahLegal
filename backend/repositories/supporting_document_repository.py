from supabase import Client

TABLE = "dokumen_pendukung"


def get(db: Client, id_dokumen: int, id_pengajuan: int) -> dict | None:
    rows = db.table(TABLE).select("*").eq("id_dokumen", id_dokumen).eq("id_pengajuan", id_pengajuan).execute().data
    return rows[0] if rows else None


def list_by_pengajuan(db: Client, id_pengajuan: int) -> list[dict]:
    return (
        db.table(TABLE)
        .select("id_dokumen, nama_dokumen, file_url, tipe_file, ukuran_kb, created_at, updated_at")
        .eq("id_pengajuan", id_pengajuan)
        .order("created_at", desc=True)
        .execute()
        .data
    )


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def delete(db: Client, id_dokumen: int) -> None:
    db.table(TABLE).delete().eq("id_dokumen", id_dokumen).execute()
