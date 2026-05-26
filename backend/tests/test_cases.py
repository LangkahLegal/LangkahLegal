from routers import cases as cases_router


def test_post_case_success(app_client):
    table_responses = {"bursa_kasus": [[{"id_bursa": 1, "status_bursa": "open"}]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/cases",
        data={
            "kategori_hukum": "pidana",
            "deskripsi_kasus_awam": "Kasus contoh",
            "tanggal_konsultasi": "2026-06-01",
            "jam_mulai": "09:00",
            "jam_selesai": "10:00",
        },
    )

    assert response.status_code == 201
    assert response.json()["data"]["id_bursa"] == 1


def test_post_case_validation_error(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.post("/api/v1/cases", data={"kategori_hukum": "pidana"})
    assert response.status_code == 422


def test_post_case_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "konsultan"})
    response = client.post(
        "/api/v1/cases",
        data={
            "kategori_hukum": "pidana",
            "deskripsi_kasus_awam": "Kasus contoh",
            "tanggal_konsultasi": "2026-06-01",
            "jam_mulai": "09:00",
            "jam_selesai": "10:00",
        },
    )
    assert response.status_code == 403


def test_post_case_with_files(app_client, monkeypatch):
    async def fake_upload(*args, **kwargs):
        return {
            "nama_dokumen": "bukti.pdf",
            "file_url": "http://example.com/bukti.pdf",
            "tipe_file": "pdf",
            "ukuran_kb": 10,
        }

    monkeypatch.setattr(
        cases_router, "upload_supporting_document_to_supabase", fake_upload
    )

    table_responses = {
        "bursa_kasus": [
            [{"id_bursa": 1, "status_bursa": "open"}],
            [],
        ]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    files = [
        (
            "dokumen_pendukung_files",
            ("bukti.pdf", b"%PDF-1.4 test", "application/pdf"),
        )
    ]

    response = client.post(
        "/api/v1/cases",
        data={
            "kategori_hukum": "pidana",
            "deskripsi_kasus_awam": "Kasus contoh",
            "tanggal_konsultasi": "2026-06-01",
            "jam_mulai": "09:00",
            "jam_selesai": "10:00",
        },
        files=files,
    )

    assert response.status_code == 201
    assert response.json()["dokumen_terupload"][0] == "bukti.pdf"


def test_list_cases_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.get("/api/v1/cases")
    assert response.status_code == 403


def test_list_cases_success(app_client):
    table_responses = {"bursa_kasus": [[{"id_bursa": 1, "status_bursa": "open"}]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 2, "role": "konsultan"},
    )

    response = client.get("/api/v1/cases")

    assert response.status_code == 200
    assert response.json()["data"][0]["id_bursa"] == 1


def test_claim_case_success(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 7}]],
        "bursa_kasus": [
            [
                {
                    "id_bursa": 1,
                    "id_user": 2,
                    "status_bursa": "open",
                    "deskripsi_kasus_awam": "Kasus",
                    "tanggal_konsultasi": "2026-06-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "dokumen_bukti": None,
                }
            ],
            [],
        ],
        "pengajuan_konsultasi": [[], [{"id_pengajuan": 10}]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 3, "role": "konsultan"},
    )

    response = client.post("/api/v1/cases/1/claim")

    assert response.status_code == 201
    assert response.json()["data"]["id_pengajuan"] == 10


def test_claim_case_bursa_not_found(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 7}]],
        "bursa_kasus": [[]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 3, "role": "konsultan"},
    )

    response = client.post("/api/v1/cases/1/claim")

    assert response.status_code == 404


def test_claim_case_already_closed(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 7}]],
        "bursa_kasus": [
            [
                {
                    "id_bursa": 1,
                    "status_bursa": "closed",
                    "id_user": 2,
                    "tanggal_konsultasi": "2026-06-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                }
            ]
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 3, "role": "konsultan"},
    )

    response = client.post("/api/v1/cases/1/claim")

    assert response.status_code == 400


def test_claim_case_profile_not_found(app_client):
    table_responses = {"konsultan": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 3, "role": "konsultan"},
    )

    response = client.post("/api/v1/cases/1/claim")

    assert response.status_code == 404


def test_claim_case_schedule_conflict(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 7}]],
        "bursa_kasus": [
            [
                {
                    "id_bursa": 1,
                    "id_user": 2,
                    "status_bursa": "open",
                    "tanggal_konsultasi": "2026-06-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "deskripsi_kasus_awam": "Kasus",
                    "dokumen_bukti": None,
                }
            ]
        ],
        "pengajuan_konsultasi": [
            [
                {
                    "jam_mulai": "09:30",
                    "jam_selesai": "10:30",
                    "jadwal_ketersediaan": {
                        "tanggal": "2026-06-01",
                        "jam_mulai": "09:00",
                        "jam_selesai": "10:00",
                    },
                    "tanggal_pengajuan": "2026-06-01",
                }
            ]
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 3, "role": "konsultan"},
    )

    response = client.post("/api/v1/cases/1/claim")

    assert response.status_code == 400


def test_claim_case_insert_failure_rolls_back(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 7}]],
        "bursa_kasus": [
            [
                {
                    "id_bursa": 1,
                    "id_user": 2,
                    "status_bursa": "open",
                    "deskripsi_kasus_awam": "Kasus",
                    "tanggal_konsultasi": "2026-06-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "dokumen_bukti": None,
                }
            ],
            [],
            [],
        ],
        "pengajuan_konsultasi": [[], []],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 3, "role": "konsultan"},
    )

    response = client.post("/api/v1/cases/1/claim")

    assert response.status_code == 500
