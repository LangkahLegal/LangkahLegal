

def test_admin_stats_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.get("/api/v1/admin/stats")
    assert response.status_code == 403


def test_admin_stats_success_view(app_client):
    table_responses = {
        "users": [[{"role": "client"}, {"role": "konsultan"}]],
        "konsultan": [
            [{"status_verifikasi": "pending"}, {"status_verifikasi": "terverifikasi"}]
        ],
        "admin_transaction_stats": [
            [{"total_transactions": 2, "total_revenue": 5000, "total_commission": 500}]
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 99, "role": "admin"},
    )

    response = client.get("/api/v1/admin/stats")

    assert response.status_code == 200
    body = response.json()
    assert body["total_users"] == 2
    assert body["total_consultants"] == 2
    assert body["total_transactions"] == 2


def test_admin_stats_fallback(app_client):
    table_responses = {
        "users": [[{"role": "client"}]],
        "konsultan": [[{"status_verifikasi": "pending"}]],
        "admin_transaction_stats": [[]],
        "transaksi": [[{"gross_amount": 1000, "komisi_platform": 100}]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 99, "role": "admin"},
    )

    response = client.get("/api/v1/admin/stats")

    assert response.status_code == 200
    assert response.json()["total_revenue"] == 1000


def test_admin_consultant_list_success(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 1, "nama_lengkap": "Konsultan"}]]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 99, "role": "admin"},
    )

    response = client.get("/api/v1/admin/consultants")

    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_admin_consultant_detail_not_found(app_client):
    table_responses = {"konsultan": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 99, "role": "admin"},
    )

    response = client.get("/api/v1/admin/consultants/1")

    assert response.status_code == 404


def test_admin_consultant_detail_success(app_client):
    table_responses = {
        "konsultan": [
            [
                {
                    "id_konsultan": 1,
                    "nama_lengkap": "Konsultan",
                    "rating_ulasan": [{"skor_rating": 5}, {"skor_rating": 3}],
                }
            ]
        ],
        "pengajuan_konsultasi": [
            [
                {"status_pengajuan": "selesai"},
                {"status_pengajuan": "terjadwal"},
            ]
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 99, "role": "admin"},
    )

    response = client.get("/api/v1/admin/consultants/1")

    assert response.status_code == 200
    assert response.json()["data"]["rating"] == 4.0
    assert response.json()["data"]["completed_consultations"] == 1


def test_admin_verify_consultant_invalid_action(app_client):
    client, _ = app_client(current_user={"id_user": 99, "role": "admin"})

    response = client.patch(
        "/api/v1/admin/consultants/1/verify",
        json={"action": "invalid"},
    )

    assert response.status_code == 400


def test_admin_verify_consultant_not_found(app_client):
    table_responses = {"konsultan": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 99, "role": "admin"},
    )

    response = client.patch(
        "/api/v1/admin/consultants/1/verify",
        json={"action": "terverifikasi"},
    )

    assert response.status_code == 404


def test_admin_verify_consultant_success(app_client):
    table_responses = {
        "konsultan": [
            [{"id_konsultan": 1, "status_verifikasi": "pending"}],
            [{"id_konsultan": 1, "status_verifikasi": "terverifikasi"}],
        ]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 99, "role": "admin"},
    )

    response = client.patch(
        "/api/v1/admin/consultants/1/verify",
        json={"action": "terverifikasi"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status_verifikasi"] == "terverifikasi"
