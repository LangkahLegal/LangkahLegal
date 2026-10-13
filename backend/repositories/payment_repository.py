from supabase import Client

TABLE = "transaksi"
STATS_VIEW = "admin_transaction_stats"


def get_by_order_id(db: Client, order_id: str) -> dict | None:
    rows = (
        db.table(TABLE)
        .select("*, pengajuan_konsultasi(id_pengajuan, status_pengajuan)")
        .eq("order_id", order_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


def get_latest_by_pengajuan(db: Client, id_pengajuan: int) -> dict | None:
    rows = (
        db.table(TABLE)
        .select("*")
        .eq("id_pengajuan", id_pengajuan)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


def list_by_pengajuan_and_status(db: Client, id_pengajuan: int, status_pembayaran: str) -> list[dict]:
    return (
        db.table(TABLE)
        .select("*")
        .eq("id_pengajuan", id_pengajuan)
        .eq("status_pembayaran", status_pembayaran)
        .execute()
        .data
    )


def list_amounts_by_status(db: Client, status_pembayaran: str) -> list[dict]:
    return (
        db.table(TABLE)
        .select("gross_amount, komisi_platform")
        .eq("status_pembayaran", status_pembayaran)
        .execute()
        .data
    )


def get_stats_view(db: Client) -> list[dict]:
    return db.table(STATS_VIEW).select("*").execute().data


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def update_by_order_id(db: Client, order_id: str, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("order_id", order_id).execute().data
