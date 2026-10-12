from services import storage_service


def test_create_consultation_success(app_client):
    table_responses = {
        "jadwal_ketersediaan": [
            [
                {
                    "id_jadwal": 1,
                    "id_konsultan": 7,
                    "tanggal": "2026-01-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                }
            ]
        ],
        "pengajuan_konsultasi": [[], [{"id_pengajuan": 55}]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/consultations",
        data={
            "id_jadwal": 1,
            "deskripsi_kasus": "Kasus contoh",
            "jam_mulai": "09:00",
            "jam_selesai": "10:00",
        },
    )

    assert response.status_code == 201
    assert response.json()["data"]["id_pengajuan"] == 55


def _booking_request(app_client, booked, jam_mulai, jam_selesai):
    table_responses = {
        "jadwal_ketersediaan": [
            [
                {
                    "id_jadwal": 1,
                    "id_konsultan": 7,
                    "tanggal": "2026-01-01",
                    "jam_mulai": "08:00:00",
                    "jam_selesai": "17:00:00",
                }
            ]
        ],
        "pengajuan_konsultasi": [booked, [{"id_pengajuan": 56}]],
    }
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    response = client.post(
        "/api/v1/consultations",
        data={
            "id_jadwal": 1,
            "deskripsi_kasus": "Kasus contoh",
            "jam_mulai": jam_mulai,
            "jam_selesai": jam_selesai,
        },
    )
    return response, supabase


BOOKED_0900_1000 = [{"tanggal_pengajuan": "2026-01-01", "jam_mulai": "09:00:00", "jam_selesai": "10:00:00"}]


def test_create_consultation_rejects_overlapping_slot(app_client):
    response, supabase = _booking_request(app_client, BOOKED_0900_1000, "09:30:00", "10:30:00")

    assert response.status_code == 409
    assert "09:00-10:00" in response.json()["detail"]
    assert supabase.inserted("pengajuan_konsultasi") == []


def test_create_consultation_allows_adjacent_slot(app_client):
    response, _ = _booking_request(app_client, BOOKED_0900_1000, "10:00:00", "11:00:00")

    assert response.status_code == 201


def test_create_consultation_ignores_booking_on_other_date(app_client):
    other_day = [{"tanggal_pengajuan": "2026-01-02", "jam_mulai": "09:00:00", "jam_selesai": "10:00:00"}]

    response, _ = _booking_request(app_client, other_day, "09:00:00", "10:00:00")

    assert response.status_code == 201


def test_create_consultation_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "konsultan"})

    response = client.post(
        "/api/v1/consultations",
        data={
            "id_jadwal": 1,
            "deskripsi_kasus": "Kasus",
            "jam_mulai": "09:00",
            "jam_selesai": "10:00",
        },
    )

    assert response.status_code == 403


def test_create_consultation_missing_fields(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})

    response = client.post("/api/v1/consultations", data={"id_jadwal": 1})

    assert response.status_code == 422


def test_create_consultation_jadwal_not_found(app_client):
    table_responses = {"jadwal_ketersediaan": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/consultations",
        data={
            "id_jadwal": 1,
            "deskripsi_kasus": "Kasus",
            "jam_mulai": "09:00",
            "jam_selesai": "10:00",
        },
    )

    assert response.status_code == 404


def test_create_consultation_invalid_time(app_client):
    table_responses = {
        "jadwal_ketersediaan": [
            [
                {
                    "id_jadwal": 1,
                    "id_konsultan": 7,
                    "tanggal": "2026-01-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                }
            ]
        ]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/consultations",
        data={
            "id_jadwal": 1,
            "deskripsi_kasus": "Kasus",
            "jam_mulai": "08:00",
            "jam_selesai": "10:00",
        },
    )

    assert response.status_code == 400


def test_get_my_consultations_success(app_client):
    table_responses = {"pengajuan_konsultasi": [[{"id_pengajuan": 1}]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/consultations")

    assert response.status_code == 200
    assert response.json()["data"][0]["id_pengajuan"] == 1


def test_get_detail_pengajuan_success(app_client):
    table_responses = {
        "pengajuan_konsultasi": [
            [
                {
                    "id_pengajuan": 1,
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "tanggal_pengajuan": "2026-01-01",
                    "jadwal_ketersediaan": {
                        "tanggal": "2026-01-05",
                        "konsultan": {"tarif_per_sesi": 100},
                    },
                    "users": {"nama": "Client", "foto_profil": None},
                    "dokumen_pendukung": [
                        {
                            "id_dokumen": 1,
                            "nama_dokumen": "doc.pdf",
                            "file_url": "http://example.com/doc.pdf",
                            "tipe_file": "pdf",
                            "ukuran_kb": 10,
                        }
                    ],
                }
            ]
        ]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/consultations/1")

    assert response.status_code == 200
    assert response.json()["data"]["total_harga"] == 200


def test_get_detail_pengajuan_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "admin"})
    response = client.get("/api/v1/consultations/1")
    assert response.status_code == 403


def test_get_detail_pengajuan_not_found(app_client):
    table_responses = {"pengajuan_konsultasi": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/consultations/1")

    assert response.status_code == 404


def test_update_status_success(app_client):
    table_responses = {
        "pengajuan_konsultasi": [
            [
                {
                    "id_pengajuan": 1,
                    "id_user": 2,
                    "id_konsultan": 7,
                    "id_jadwal": 3,
                }
            ],
            [{"id_pengajuan": 1}],
        ],
        "konsultan": [[{"id_konsultan": 7}]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.put(
        "/api/v1/consultations/1/status",
        params={"new_status": "terjadwal"},
    )

    assert response.status_code == 200


def test_update_status_not_found(app_client):
    table_responses = {"pengajuan_konsultasi": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.put(
        "/api/v1/consultations/1/status",
        params={"new_status": "terjadwal"},
    )

    assert response.status_code == 404


def test_get_booked_slots_success(app_client):
    table_responses = {
        "pengajuan_konsultasi": [
            [
                {
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "tanggal_pengajuan": "2026-01-01",
                }
            ]
        ]
    }
    client, _ = app_client(table_responses=table_responses)

    response = client.get("/api/v1/consultations/7/booked-slots")

    assert response.status_code == 200
    assert response.json()["data"][0]["jam_mulai"] == "09:00"


def test_get_documents_success(app_client):
    table_responses = {
        "pengajuan_konsultasi": [[{"id_user": 1, "id_konsultan": 2}]],
        "dokumen_pendukung": [
            [
                {
                    "id_dokumen": 1,
                    "nama_dokumen": "doc.pdf",
                    "file_url": "http://example.com/doc.pdf",
                    "tipe_file": "pdf",
                    "ukuran_kb": 10,
                }
            ]
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/consultations/1/documents")

    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_get_documents_forbidden(app_client):
    table_responses = {"pengajuan_konsultasi": [[{"id_user": 2, "id_konsultan": 2}]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/consultations/1/documents")

    assert response.status_code == 403


def test_upload_document_success(app_client, monkeypatch):
    async def fake_upload(*args, **kwargs):
        return {
            "nama_dokumen": "doc.pdf",
            "file_url": "http://example.com/doc.pdf",
            "tipe_file": "pdf",
            "ukuran_kb": 10,
        }

    monkeypatch.setattr(storage_service, "upload_supporting_document_to_supabase", fake_upload)

    table_responses = {
        "pengajuan_konsultasi": [[{"id_user": 1}]],
        "dokumen_pendukung": [[{"id_dokumen": 5}]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    files = [
        (
            "dokumen_pendukung_files",
            ("doc.pdf", b"%PDF-1.4 test", "application/pdf"),
        )
    ]

    response = client.post("/api/v1/consultations/1/documents", files=files)

    assert response.status_code == 201
    assert response.json()["data"]["dokumen_terupload"][0]["id_dokumen"] == 5


def test_upload_document_missing_files(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.post("/api/v1/consultations/1/documents")
    assert response.status_code == 422


def test_upload_document_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "konsultan"})

    files = [
        (
            "dokumen_pendukung_files",
            ("doc.pdf", b"%PDF-1.4 test", "application/pdf"),
        )
    ]

    response = client.post("/api/v1/consultations/1/documents", files=files)

    assert response.status_code == 403


def test_delete_document_success(app_client):
    table_responses = {
        "pengajuan_konsultasi": [[{"id_user": 1}]],
        "dokumen_pendukung": [
            [
                {
                    "id_dokumen": 5,
                    "file_url": "https://project.supabase.co/storage/v1/object/public/berkas-pendukung/path.pdf",
                }
            ],
            [],
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.delete("/api/v1/consultations/1/documents/5")

    assert response.status_code == 200
    assert response.json()["id_dokumen"] == 5


def test_delete_document_not_found(app_client):
    table_responses = {
        "pengajuan_konsultasi": [[{"id_user": 1}]],
        "dokumen_pendukung": [[]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.delete("/api/v1/consultations/1/documents/999")

    assert response.status_code == 404


def test_assign_schedule_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})

    response = client.put(
        "/api/v1/consultations/1/assign-schedule",
        json={"id_jadwal": 5, "jam_mulai": "09:00", "jam_selesai": "10:00"},
    )

    assert response.status_code == 403


def test_assign_schedule_pengajuan_not_found(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 7}]],
        "pengajuan_konsultasi": [[]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.put(
        "/api/v1/consultations/1/assign-schedule",
        json={"id_jadwal": 5, "jam_mulai": "09:00", "jam_selesai": "10:00"},
    )

    assert response.status_code == 404


def test_assign_schedule_invalid_time(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 7}]],
        "pengajuan_konsultasi": [[{"id_pengajuan": 1, "id_konsultan": 7, "status_pengajuan": "pending"}]],
        "jadwal_ketersediaan": [
            [
                {
                    "id_jadwal": 5,
                    "id_konsultan": 7,
                    "tanggal": "2026-06-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "status_tersedia": True,
                }
            ]
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.put(
        "/api/v1/consultations/1/assign-schedule",
        json={"id_jadwal": 5, "jam_mulai": "08:00", "jam_selesai": "10:00"},
    )

    assert response.status_code == 400


def test_assign_schedule_success(app_client):
    table_responses = {
        "konsultan": [[{"id_konsultan": 7}]],
        "pengajuan_konsultasi": [
            [{"id_pengajuan": 1, "id_konsultan": 7, "status_pengajuan": "pending"}],
            [{"id_pengajuan": 1, "status_pengajuan": "menunggu_pembayaran"}],
        ],
        "jadwal_ketersediaan": [
            [
                {
                    "id_jadwal": 5,
                    "id_konsultan": 7,
                    "tanggal": "2026-06-01",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "status_tersedia": True,
                }
            ],
            [],
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.put(
        "/api/v1/consultations/1/assign-schedule",
        json={"id_jadwal": 5, "jam_mulai": "09:00", "jam_selesai": "10:00"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status_pengajuan"] == "menunggu_pembayaran"
