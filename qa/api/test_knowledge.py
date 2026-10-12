import pytest

from core.limiter import limiter

CLIENT = {"id_user": 1, "role": "client", "nama": "Client"}
UU_13 = "/akn/id/act/uu-13-2003"

PASAL_ROW = {
    "id_dokumen": 812,
    "pasal_bagian": "Pasal 156",
    "judul_bab": "BAB XII",
    "isi_teks": "(1) Dalam hal terjadi pemutusan hubungan kerja...",
    "frbr_uri": UU_13,
    "nama_uu": "Undang-Undang tentang Ketenagakerjaan",
    "nomor_uu": "UU No. 13 Tahun 2003",
    "tahun_uu": 2003,
    "kategori": "ketenagakerjaan",
    "status_hukum": "berlaku",
}


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    limiter.reset()
    yield


def test_get_pasal_requires_auth(app_client):
    client, _ = app_client(auth_error=Exception("no token"))

    response = client.get("/api/v1/knowledge/pasal/812")

    assert response.status_code == 401


def test_get_pasal_success(app_client):
    client, _ = app_client(
        table_responses={"dokumen_hukum": [[PASAL_ROW]]},
        current_user=CLIENT,
    )

    response = client.get("/api/v1/knowledge/pasal/812")

    assert response.status_code == 200
    body = response.json()
    assert body["pasal_bagian"] == "Pasal 156"
    assert body["document"]["frbr_uri"] == UU_13
    assert body["document"]["has_file"] is False
    assert "embedding" not in body


def test_get_pasal_not_found(app_client):
    client, _ = app_client(table_responses={"dokumen_hukum": [[]]}, current_user=CLIENT)

    response = client.get("/api/v1/knowledge/pasal/999")

    assert response.status_code == 404


def test_document_detail_success(app_client):
    client, _ = app_client(
        table_responses={"dokumen_hukum": [([PASAL_ROW], 193)]},
        current_user=CLIENT,
    )

    response = client.get("/api/v1/knowledge/documents/detail", params={"frbr_uri": UU_13})

    assert response.status_code == 200
    assert response.json()["total_pasal"] == 193
    assert response.json()["nomor_uu"] == "UU No. 13 Tahun 2003"


def test_document_detail_not_found(app_client):
    client, _ = app_client(table_responses={"dokumen_hukum": [([], 0)]}, current_user=CLIENT)

    response = client.get("/api/v1/knowledge/documents/detail", params={"frbr_uri": UU_13})

    assert response.status_code == 404


@pytest.mark.parametrize("bad_uri", ["uu-13-2003", "/akn/../etc/passwd", "/akn/id act", "/other/id/act/x"])
def test_document_endpoints_reject_malformed_uri(app_client, bad_uri):
    client, _ = app_client(current_user=CLIENT)

    detail = client.get("/api/v1/knowledge/documents/detail", params={"frbr_uri": bad_uri})
    pasal = client.get("/api/v1/knowledge/documents/pasal", params={"frbr_uri": bad_uri})

    assert detail.status_code == 422
    assert pasal.status_code == 422


def test_list_document_pasal_paginated(app_client):
    rows = [
        {k: PASAL_ROW[k] for k in ("id_dokumen", "pasal_bagian", "judul_bab", "isi_teks")},
    ]
    client, _ = app_client(table_responses={"dokumen_hukum": [(rows, 193)]}, current_user=CLIENT)

    response = client.get(
        "/api/v1/knowledge/documents/pasal",
        params={"frbr_uri": UU_13, "page": 2, "page_size": 20},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 193
    assert body["page"] == 2
    assert body["data"][0]["id_dokumen"] == 812
    assert "embedding" not in body["data"][0]


def test_list_document_pasal_unknown_document(app_client):
    client, _ = app_client(table_responses={"dokumen_hukum": [([], 0)]}, current_user=CLIENT)

    response = client.get("/api/v1/knowledge/documents/pasal", params={"frbr_uri": UU_13})

    assert response.status_code == 404


def test_list_document_pasal_search_without_match_returns_empty(app_client):
    client, _ = app_client(table_responses={"dokumen_hukum": [([], 0)]}, current_user=CLIENT)

    response = client.get(
        "/api/v1/knowledge/documents/pasal",
        params={"frbr_uri": UU_13, "search": "pesangon),id_dokumen.gt.0"},
    )

    assert response.status_code == 200
    assert response.json()["data"] == []


def test_list_document_pasal_rejects_page_size_over_limit(app_client):
    client, _ = app_client(current_user=CLIENT)

    response = client.get(
        "/api/v1/knowledge/documents/pasal",
        params={"frbr_uri": UU_13, "page_size": 500},
    )

    assert response.status_code == 422
