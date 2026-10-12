from typing import Optional

from supabase import Client

TABLE = "pengajuan_konsultasi"

SUMMARY_COLUMNS = "id_pengajuan, id_user, id_konsultan, id_bursa, status_pengajuan, link_zoom"

REQUEST_COLUMNS = """
            id_pengajuan,
            deskripsi_kasus,
            status_pengajuan,
            created_at,
            tanggal_pengajuan,
            jam_mulai,
            jam_selesai,
            id_bursa,
            users ( nama, foto_profil )
        """


def get_by_id(db: Client, id_pengajuan: int, columns: str = "*") -> dict | None:
    rows = db.table(TABLE).select(columns).eq("id_pengajuan", id_pengajuan).execute().data
    return rows[0] if rows else None


def get_by_id_strict(db: Client, id_pengajuan: int, columns: str = "*") -> dict:
    return db.table(TABLE).select(columns).eq("id_pengajuan", id_pengajuan).single().execute().data


def get_for_konsultan(db: Client, id_pengajuan: int, id_konsultan: int) -> dict | None:
    rows = (
        db.table(TABLE)
        .select("id_pengajuan, id_konsultan, status_pengajuan")
        .eq("id_pengajuan", id_pengajuan)
        .eq("id_konsultan", id_konsultan)
        .execute()
        .data
    )
    return rows[0] if rows else None


def get_for_payment(db: Client, id_pengajuan: int, id_user: int) -> dict | None:
    rows = (
        db.table(TABLE)
        .select("*, konsultan(tarif_per_sesi, nama_lengkap), users(nama, email)")
        .eq("id_pengajuan", id_pengajuan)
        .eq("id_user", id_user)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


def get_detail(
    db: Client,
    id_pengajuan: int,
    id_user: Optional[int] = None,
    id_konsultan: Optional[int] = None,
) -> dict | None:
    query = (
        db.table(TABLE)
        .select("""
            *,
            jadwal_ketersediaan(
                *,
                konsultan(nama_lengkap, tarif_per_sesi, foto_profil, spesialisasi)
            ),
            konsultan(nama_lengkap, tarif_per_sesi, foto_profil, spesialisasi),
            users(nama, email, foto_profil),
            dokumen_pendukung(id_dokumen, nama_dokumen, file_url, tipe_file, ukuran_kb, created_at, updated_at)
        """)
        .eq("id_pengajuan", id_pengajuan)
    )

    if id_user is not None:
        query = query.eq("id_user", id_user)
    if id_konsultan is not None:
        query = query.eq("id_konsultan", id_konsultan)

    rows = query.execute().data
    return rows[0] if rows else None


def list_with_relations(
    db: Client,
    id_user: Optional[int] = None,
    id_konsultan: Optional[int] = None,
) -> list[dict]:
    query = db.table(TABLE).select("""
        *,
        dokumen_pendukung (
            id_dokumen, nama_dokumen, file_url, tipe_file, ukuran_kb, created_at, updated_at
        ),
        konsultan (
            nama_lengkap, spesialisasi, foto_profil
        ),
        jadwal_ketersediaan (
            tanggal, jam_mulai, jam_selesai,
            konsultan (
                nama_lengkap, spesialisasi, foto_profil
            )
        )
    """)

    if id_user is not None:
        query = query.eq("id_user", id_user)
    if id_konsultan is not None:
        query = query.eq("id_konsultan", id_konsultan)

    return query.execute().data


def list_by_konsultan(db: Client, id_konsultan: int, columns: str) -> list[dict]:
    return db.table(TABLE).select(columns).eq("id_konsultan", id_konsultan).execute().data


def list_by_konsultan_and_statuses(db: Client, id_konsultan: int, statuses: list[str], columns: str) -> list[dict]:
    return (
        db.table(TABLE)
        .select(columns)
        .eq("id_konsultan", id_konsultan)
        .in_("status_pengajuan", statuses)
        .execute()
        .data
    )


def list_requests_for_konsultan(db: Client, id_konsultan: int, statuses: list[str]) -> list[dict]:
    return (
        db.table(TABLE)
        .select(REQUEST_COLUMNS)
        .eq("id_konsultan", id_konsultan)
        .in_("status_pengajuan", statuses)
        .order("created_at", desc=True)
        .execute()
        .data
    )


def list_history_for_konsultan(db: Client, id_konsultan: int, excluded_status: str) -> list[dict]:
    return (
        db.table(TABLE)
        .select("*, users(nama, foto_profil), jadwal_ketersediaan(tanggal), transaksi(nominal_konsultan)")
        .eq("id_konsultan", id_konsultan)
        .neq("status_pengajuan", excluded_status)
        .execute()
        .data
    )


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def update(db: Client, id_pengajuan: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_pengajuan", id_pengajuan).execute().data


def get_summary(db: Client, id_pengajuan: int) -> dict | None:
    return get_by_id(db, id_pengajuan, SUMMARY_COLUMNS)


def get_summary_strict(db: Client, id_pengajuan: int) -> dict:
    return get_by_id_strict(db, id_pengajuan, SUMMARY_COLUMNS)


def list_income_rows(db: Client, id_konsultan: int) -> list[dict]:
    return list_by_konsultan(db, id_konsultan, "transaksi(nominal_konsultan, status_pembayaran)")


def list_statuses(db: Client, id_konsultan: int) -> list[dict]:
    return list_by_konsultan(db, id_konsultan, "id_pengajuan, status_pengajuan")


def list_clients_by_statuses(db: Client, id_konsultan: int, statuses: list[str]) -> list[dict]:
    return list_by_konsultan_and_statuses(db, id_konsultan, statuses, "id_user, status_pengajuan")


def list_with_client_and_date(db: Client, id_konsultan: int, statuses: list[str]) -> list[dict]:
    return list_by_konsultan_and_statuses(
        db, id_konsultan, statuses, "*, users(nama, foto_profil), jadwal_ketersediaan(tanggal)"
    )


def list_time_slots(db: Client, id_konsultan: int, statuses: list[str]) -> list[dict]:
    return list_by_konsultan_and_statuses(
        db,
        id_konsultan,
        statuses,
        "jam_mulai, jam_selesai, jadwal_ketersediaan(tanggal, jam_mulai, jam_selesai), tanggal_pengajuan",
    )


def list_booked_slots(db: Client, id_konsultan: int, statuses: list[str]) -> list[dict]:
    return list_by_konsultan_and_statuses(db, id_konsultan, statuses, "jam_mulai, jam_selesai, tanggal_pengajuan")
