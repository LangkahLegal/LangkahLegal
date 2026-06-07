from types import SimpleNamespace
from routers import auth as auth_router


def test_signup_success(app_client, monkeypatch):
    async def fake_post_auth(path, payload=None, params=None):
        return {"session": {"access_token": "token"}, "user": {"id": "auth-1"}}

    monkeypatch.setattr(auth_router, "_post_auth", fake_post_auth)

    client, _ = app_client()
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "user@example.com",
            "password": "Secret123!",
            "name": "User",
            "role": "client",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["session"]["access_token"] == "token"


def test_signup_validation_error(app_client):
    client, _ = app_client()
    response = client.post("/api/v1/auth/signup", json={"email": "user@example.com"})
    assert response.status_code == 422


def test_login_password_success(app_client, monkeypatch):
    async def fake_post_auth(path, payload=None, params=None):
        return {
            "access_token": "token",
            "refresh_token": "refresh",
            "user": {"id": "auth-1"},
        }

    monkeypatch.setattr(auth_router, "_post_auth", fake_post_auth)

    client, _ = app_client()
    response = client.post(
        "/api/v1/auth/login-password",
        json={"email": "user@example.com", "password": "Secret123!"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["session"]["access_token"] == "token"


def test_exchange_session_missing_params(app_client):
    client, _ = app_client()
    response = client.get("/api/v1/auth/session")
    assert response.status_code == 404


def test_refresh_missing_token(app_client):
    client, _ = app_client()
    response = client.post("/api/v1/auth/refresh", json={})
    assert response.status_code == 400


def test_profile_success(app_client):
    auth_user = SimpleNamespace(
        id="auth-1",
        email="user@example.com",
        user_metadata={"full_name": "User"},
    )
    table_responses = {
        "users": [
            [
                {
                    "id_user": 1,
                    "nama": "User",
                    "email": "user@example.com",
                    "role": "client",
                    "auth_user_id": "auth-1",
                }
            ]
        ]
    }

    client, _ = app_client(table_responses=table_responses, auth_user=auth_user)
    response = client.get(
        "/api/v1/auth/profile", headers={"Authorization": "Bearer token"}
    )

    assert response.status_code == 200
    assert response.json()["data"]["id_user"] == 1


def test_profile_not_found_returns_none(app_client):
    auth_user = SimpleNamespace(id="auth-1", email="user@example.com", user_metadata={})
    table_responses = {"users": [[], []]}

    client, _ = app_client(table_responses=table_responses, auth_user=auth_user)
    response = client.get(
        "/api/v1/auth/profile", headers={"Authorization": "Bearer token"}
    )

    assert response.status_code == 200
    assert response.json()["data"] is None


def test_role_update_success(app_client):
    auth_user = SimpleNamespace(
        id="auth-1",
        email="user@example.com",
        user_metadata={"full_name": "User"},
    )
    table_responses = {"users": [[], [{"role": "client"}]]}

    client, _ = app_client(table_responses=table_responses, auth_user=auth_user)
    response = client.post(
        "/api/v1/auth/role",
        json={"role": "client"},
        headers={"Authorization": "Bearer token"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["role"] == "client"


def test_role_update_unauthorized(app_client):
    client, _ = app_client(auth_error=Exception("invalid"))
    response = client.post(
        "/api/v1/auth/role",
        json={"role": "client"},
        headers={"Authorization": "Bearer token"},
    )
    assert response.status_code == 401


def test_logout_success(app_client, monkeypatch):
    class DummyResponse:
        def __init__(self):
            self.status_code = 204
            self.content = b""

        def json(self):
            return {}

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, headers=None):
            return DummyResponse()

    monkeypatch.setattr(auth_router.httpx, "AsyncClient", DummyAsyncClient)

    client, _ = app_client()
    response = client.post(
        "/api/v1/auth/logout", headers={"Authorization": "Bearer token"}
    )

    assert response.status_code == 200
    assert response.json()["data"]["logout"] is True


def test_logout_unauthorized(app_client):
    client, _ = app_client()
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 401
