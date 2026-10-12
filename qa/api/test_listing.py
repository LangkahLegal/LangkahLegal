from helpers.listing import clean_search, page_window

KONSULTAN = {"id_user": 3, "role": "konsultan", "id_konsultan": 7}
CLIENT = {"id_user": 1, "role": "client"}
ADMIN = {"id_user": 9, "role": "admin"}

CATALOG_ROW = {
    "id_konsultan": 1,
    "nama_lengkap": "Budi",
    "spesialisasi": "Pidana",
    "status_verifikasi": "terverifikasi",
    "tarif_per_sesi": 100000,
    "users": {"foto_profil": None},
    "rating_ulasan": [],
}


def test_clean_search_strips_filter_syntax():
    assert clean_search("  budi,(pidana)*%  ") == "budi  pidana"
    assert clean_search(None) == ""


def test_page_window():
    assert page_window(None, 20) == (None, None)
    assert page_window(1, 20) == (0, 20)
    assert page_window(3, 10) == (20, 10)


def test_catalog_without_page_returns_everything_with_total(app_client):
    client, _ = app_client(table_responses={"konsultan": [([CATALOG_ROW, CATALOG_ROW], 2)]})

    body = client.get("/api/v1/consultants/").json()

    assert len(body["data"]) == 2
    assert body["total"] == 2
    assert "page" not in body


def test_catalog_with_page_reports_pagination(app_client):
    client, _ = app_client(table_responses={"konsultan": [([CATALOG_ROW], 37)]})

    response = client.get(
        "/api/v1/consultants/",
        params={"search": "budi", "verified": "terverifikasi", "min_price": 0, "max_price": 500000, "page": 2},
    )

    body = response.json()
    assert response.status_code == 200
    assert body["total"] == 37
    assert body["page"] == 2
    assert body["page_size"] == 20


def test_catalog_rejects_invalid_page(app_client):
    client, _ = app_client()

    assert client.get("/api/v1/consultants/", params={"page": 0}).status_code == 422
    assert client.get("/api/v1/consultants/", params={"page_size": 1000}).status_code == 422


def test_admin_consultant_list_includes_counts_per_status(app_client):
    table_responses = {
        "konsultan": [
            [{"id_konsultan": 1, "nama_lengkap": "Budi"}],
            ([], 5),
            ([], 2),
            ([], 2),
            ([], 1),
        ]
    }
    client, _ = app_client(table_responses=table_responses, current_user=ADMIN)

    body = client.get("/api/v1/admin/consultants", params={"search": "budi"}).json()

    assert body["total"] == 1
    assert body["counts"] == {"all": 5, "pending": 2, "terverifikasi": 2, "ditolak": 1}


def test_next_session_picks_nearest_upcoming(app_client):
    rows = [
        {"id_pengajuan": 1, "tanggal_pengajuan": "2099-03-01", "jam_mulai": "09:00:00"},
        {"id_pengajuan": 2, "tanggal_pengajuan": "2099-01-05", "jam_mulai": "14:00:00"},
        {"id_pengajuan": 3, "tanggal_pengajuan": "2099-01-05", "jam_mulai": "08:00:00"},
        {"id_pengajuan": 4, "tanggal_pengajuan": "2020-01-01", "jam_mulai": "08:00:00"},
        {"id_pengajuan": 5, "tanggal_pengajuan": None, "jam_mulai": None},
    ]
    client, _ = app_client(table_responses={"pengajuan_konsultasi": [rows]}, current_user=KONSULTAN)

    body = client.get("/api/v1/consultants/me/next-session").json()

    assert body["data"]["id_pengajuan"] == 3


def test_next_session_is_null_when_nothing_upcoming(app_client):
    rows = [{"id_pengajuan": 4, "tanggal_pengajuan": "2020-01-01", "jam_mulai": "08:00:00"}]
    client, _ = app_client(table_responses={"pengajuan_konsultasi": [rows]}, current_user=KONSULTAN)

    assert client.get("/api/v1/consultants/me/next-session").json() == {"data": None}


def test_next_session_forbidden_for_client(app_client):
    client, _ = app_client(current_user=CLIENT)

    assert client.get("/api/v1/consultants/me/next-session").status_code == 403


def test_konsultan_history_sorted_by_date_then_time(app_client):
    rows = [
        {"id_pengajuan": 1, "status_pengajuan": "selesai", "tanggal_pengajuan": "2099-01-05", "jam_mulai": "08:00:00"},
        {"id_pengajuan": 2, "status_pengajuan": "selesai", "tanggal_pengajuan": "2099-01-05", "jam_mulai": "14:00:00"},
        {"id_pengajuan": 3, "status_pengajuan": "ditolak", "tanggal_pengajuan": "2099-02-01", "jam_mulai": "09:00:00"},
    ]
    client, _ = app_client(table_responses={"pengajuan_konsultasi": [rows]}, current_user=KONSULTAN)

    body = client.get("/api/v1/consultants/me/history").json()

    assert [item["id_pengajuan"] for item in body["data"]] == [3, 2, 1]
    assert body["total_sesi_selesai"] == 2


def test_client_history_orders_running_sessions_first(app_client):
    rows = [
        {"id_pengajuan": 1, "status_pengajuan": "selesai", "created_at": "2026-05-01T10:00:00"},
        {"id_pengajuan": 2, "status_pengajuan": "menunggu_pembayaran", "created_at": "2026-01-01T10:00:00"},
        {"id_pengajuan": 3, "status_pengajuan": "pending", "created_at": "2026-02-01T10:00:00"},
        {"id_pengajuan": 4, "status_pengajuan": "terjadwal", "created_at": "2026-01-15T10:00:00"},
        {"id_pengajuan": 5, "status_pengajuan": "dibatalkan", "created_at": "2026-06-01T10:00:00"},
        {"id_pengajuan": 6, "status_pengajuan": "terjadwal", "created_at": "2026-03-15T10:00:00"},
    ]
    client, _ = app_client(table_responses={"pengajuan_konsultasi": [rows]}, current_user=CLIENT)

    body = client.get("/api/v1/consultations/history").json()

    assert [item["id_pengajuan"] for item in body["data"]] == [6, 4, 3, 2, 5, 1]
    assert body["total_sesi_selesai"] == 1


def test_client_history_forbidden_for_konsultan(app_client):
    client, _ = app_client(current_user=KONSULTAN)

    assert client.get("/api/v1/consultations/history").status_code == 403


def test_active_consultations_flag_is_accepted(app_client):
    rows = [{"id_pengajuan": 2, "status_pengajuan": "pending"}]
    client, _ = app_client(table_responses={"pengajuan_konsultasi": [rows]}, current_user=CLIENT)

    response = client.get("/api/v1/consultations", params={"aktif": "true"})

    assert response.status_code == 200
    assert response.json()["data"] == rows


def test_cases_filter_and_pagination(app_client):
    rows = [{"id_bursa": 2, "kategori_hukum": "pidana", "status_bursa": "open"}]
    client, _ = app_client(table_responses={"bursa_kasus": [(rows, 11)]}, current_user=KONSULTAN)

    body = client.get("/api/v1/cases", params={"kategori": "Pidana", "page": 1, "page_size": 5}).json()

    assert body["data"] == rows
    assert body["total"] == 11
    assert body["page"] == 1
    assert body["page_size"] == 5


def test_cases_without_page_returns_total_from_rows(app_client):
    rows = [{"id_bursa": 1}, {"id_bursa": 2}]
    client, _ = app_client(table_responses={"bursa_kasus": [rows]}, current_user=KONSULTAN)

    body = client.get("/api/v1/cases").json()

    assert body["total"] == 2
    assert "page" not in body
