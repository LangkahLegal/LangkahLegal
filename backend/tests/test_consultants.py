

def test_get_all_consultants_success(app_client):
    table_responses = {
        "konsultan": [
            [
                {
                    "id_konsultan": 1,
                    "nama_lengkap": "Konsultan A",
                    "spesialisasi": "Pidana",
                    "is_active": True,
                    "users": {"foto_profil": "http://example.com/a.jpg"},
                    "rating_ulasan": [{"skor_rating": 5}, {"skor_rating": 4}],
                }
            ]
        ]
    }
    client, _ = app_client(table_responses=table_responses)

    response = client.get("/api/v1/consultants")

    assert response.status_code == 200
    body = response.json()
    assert body["data"][0]["rating"] == 4.5


def test_get_consultant_detail_not_found(app_client):
    table_responses = {"konsultan": [[]]}
    client, _ = app_client(table_responses=table_responses)

    response = client.get("/api/v1/consultants/999")

    assert response.status_code == 404


def test_get_consultant_detail_success(app_client):
    table_responses = {
        "konsultan": [
            [
                {
                    "id_konsultan": 1,
                    "nama_lengkap": "Konsultan A",
                    "rating_ulasan": [{"skor_rating": 5}],
                }
            ]
        ],
        "jadwal_ketersediaan": [[{"id_jadwal": 1, "tanggal": "2026-01-01"}]],
    }
    client, _ = app_client(table_responses=table_responses)

    response = client.get("/api/v1/consultants/1")

    assert response.status_code == 200
    assert response.json()["data"]["jadwal_ketersediaan"][0]["id_jadwal"] == 1


def test_get_consultant_schedules_success(app_client):
    table_responses = {
        "jadwal_ketersediaan": [[{"id_jadwal": 1, "status_tersedia": True}]]
    }
    client, _ = app_client(table_responses=table_responses)

    response = client.get("/api/v1/consultants/1/schedules")

    assert response.status_code == 200
    assert response.json()["data"][0]["id_jadwal"] == 1


def test_get_my_schedules_success(app_client):
    table_responses = {
        "konsultan": [{"id_konsultan": 7}],
        "jadwal_ketersediaan": [
            [
                {
                    "id_jadwal": 1,
                    "tanggal": "2026-01-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "status_tersedia": False,
                    "pengajuan_konsultasi": [{"users": {"nama": "Klien"}}],
                }
            ]
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.get("/api/v1/consultants/me/schedules")

    assert response.status_code == 200
    assert response.json()[0]["nama_klien"] == "Klien"


def test_dashboard_stats_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.get("/api/v1/consultants/me/dashboard-stats")
    assert response.status_code == 403


def test_dashboard_stats_success(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 5}]],
        "pengajuan_konsultasi": [
            [
                {
                    "transaksi": [
                        {"nominal_konsultan": 1000, "status_pembayaran": "settlement"}
                    ]
                },
                {
                    "transaksi": [
                        {"nominal_konsultan": 500, "status_pembayaran": "pending"}
                    ]
                },
            ],
            [
                {"id_user": 1, "status_pengajuan": "terjadwal"},
                {"id_user": 2, "status_pengajuan": "selesai"},
                {"id_user": 1, "status_pengajuan": "terjadwal"},
            ],
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.get("/api/v1/consultants/me/dashboard-stats")

    assert response.status_code == 200
    body = response.json()
    assert body["total_income"] == 1000
    assert body["total_klien"] == 2
    assert body["total_klien_aktif"] == 2


def test_upload_jadwal_konsultan_success(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 5}]],
        "jadwal_ketersediaan": [[{"id_jadwal": 10}]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.post(
        "/api/v1/consultants/schedules",
        json={"tanggal": "2026-01-01", "jam_mulai": "09:00", "jam_selesai": "10:00"},
    )

    assert response.status_code == 201
    assert response.json()["data"]["id_jadwal"] == 10


def test_upload_jadwal_konsultan_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.post(
        "/api/v1/consultants/schedules",
        json={"tanggal": "2026-01-01", "jam_mulai": "09:00", "jam_selesai": "10:00"},
    )
    assert response.status_code == 403


def test_edit_jadwal_konsultan_not_found(app_client):
    table_responses = {"jadwal_ketersediaan": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.put(
        "/api/v1/consultants/schedules/10",
        json={"jam_mulai": "10:00"},
    )

    assert response.status_code == 400


def test_edit_jadwal_konsultan_success(app_client):
    table_responses = {
        "jadwal_ketersediaan": [
            [{"id_jadwal": 10, "status_tersedia": True}],
            [{"id_jadwal": 10, "jam_mulai": "10:00"}],
        ]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.put(
        "/api/v1/consultants/schedules/10",
        json={"jam_mulai": "10:00"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["id_jadwal"] == 10


def test_delete_jadwal_konsultan_booked(app_client):
    table_responses = {
        "jadwal_ketersediaan": [[{"id_jadwal": 10, "status_tersedia": False}]]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.delete("/api/v1/consultants/schedules/10")

    assert response.status_code == 400


def test_delete_jadwal_konsultan_success(app_client):
    table_responses = {
        "jadwal_ketersediaan": [
            [{"id_jadwal": 10, "status_tersedia": True}],
            [],
        ]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.delete("/api/v1/consultants/schedules/10")

    assert response.status_code == 200


def test_toggle_schedule_slot_success(app_client):
    table_responses = {"jadwal_ketersediaan": [[{"id_jadwal": 10}]]}
    client, _ = app_client(table_responses=table_responses)

    response = client.patch(
        "/api/v1/consultants/schedules/10/toggle",
        json={"status_tersedia": False},
    )

    assert response.status_code == 200
    assert response.json()["data"][0]["id_jadwal"] == 10


def test_toggle_global_active_success(app_client):
    table_responses = {"konsultan": [[{"id_user": 1, "is_active": True}]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.patch(
        "/api/v1/consultants/me/active-status",
        json={"is_active": True},
    )

    assert response.status_code == 200
    assert response.json()["data"][0]["is_active"] is True


def test_pending_requests_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.get("/api/v1/consultants/me/requests/pending")
    assert response.status_code == 403


def test_pending_requests_success(app_client):
    table_responses = {
        "konsultan": [{"id_konsultan": 7}],
        "pengajuan_konsultasi": [[{"id_pengajuan": 1}]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.get("/api/v1/consultants/me/requests/pending")

    assert response.status_code == 200
    assert response.json()[0]["id_pengajuan"] == 1
