from types import SimpleNamespace
from routers import users as users_router


def test_get_settings_info_success(app_client):
    table_responses = {
        "users": [{"nama": "User", "email": "user@example.com", "foto_profil": None}]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/users/me/settings")

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "user@example.com"


def test_get_settings_info_unauthorized(app_client):
    client, _ = app_client(auth_error=Exception("bad"))
    response = client.get(
        "/api/v1/users/me/settings", headers={"Authorization": "Bearer token"}
    )
    assert response.status_code == 401


def test_get_full_profile_client(app_client):
    table_responses = {
        "users": [
            {
                "nama": "User",
                "email": "user@example.com",
                "foto_profil": None,
                "role": "client",
            }
        ]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/users/me/profile/full")

    assert response.status_code == 200
    assert response.json()["role"] == "client"


def test_get_full_profile_consultant(app_client):
    table_responses = {
        "users": [
            {
                "nama": "Konsultan",
                "email": "konsultan@example.com",
                "foto_profil": "http://example.com/avatar.jpg",
                "role": "konsultan",
            }
        ],
        "konsultan": [
            {
                "id_konsultan": 10,
                "id_user": 1,
                "portofolio": "http://example.com/port.pdf",
            }
        ],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "konsultan"},
    )

    response = client.get("/api/v1/users/me/profile/full")

    assert response.status_code == 200
    assert response.json()["portofolio"] == "http://example.com/port.pdf"


def test_update_profile_json_success(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})

    response = client.put(
        "/api/v1/users/me/profile/update",
        json={"nama": "User Baru"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Profil dan kredensial berhasil diperbarui"


def test_update_profile_portofolio_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})

    response = client.put(
        "/api/v1/users/me/profile/update",
        json={"portofolio": "http://example.com/port.pdf"},
    )

    assert response.status_code == 403


def test_update_profile_validation_error(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})

    response = client.put(
        "/api/v1/users/me/profile/update",
        json={"pengalaman_tahun": "invalid"},
    )

    assert response.status_code == 422


def test_update_profile_portofolio_file_success(app_client, monkeypatch):
    async def fake_upload(*args, **kwargs):
        return "http://example.com/port.pdf"

    monkeypatch.setattr(users_router, "upload_portfolio_pdf_to_supabase", fake_upload)

    client, _ = app_client(current_user={"id_user": 1, "role": "konsultan"})

    files = {
        "portofolio_file": (
            "portfolio.pdf",
            b"%PDF-1.4 test",
            "application/pdf",
        )
    }

    response = client.put("/api/v1/users/me/profile/update", files=files)

    assert response.status_code == 200
    assert response.json()["portofolio"] == "http://example.com/port.pdf"
