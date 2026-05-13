from routers import chatbot as chatbot_router


def test_create_session_success(app_client, monkeypatch):
    table_responses = {
        "chat_sessions": [
            [
                {
                    "id": "session-1",
                    "title": "Sesi Konsultasi Baru",
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-01-01T00:00:00Z",
                }
            ]
        ]
    }
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)

    response = client.post("/api/v1/chatbot/sessions")

    assert response.status_code == 201
    assert response.json()["id"] == "session-1"


def test_create_session_failure(app_client, monkeypatch):
    table_responses = {"chat_sessions": [[]]}
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)

    response = client.post("/api/v1/chatbot/sessions")

    assert response.status_code == 500


def test_list_sessions_success(app_client, monkeypatch):
    table_responses = {
        "chat_sessions": [
            [
                {
                    "id": "session-1",
                    "title": "Sesi Konsultasi Baru",
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-01-01T00:00:00Z",
                }
            ]
        ]
    }
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)

    response = client.get("/api/v1/chatbot/sessions")

    assert response.status_code == 200
    assert response.json()["sessions"][0]["id"] == "session-1"


def test_delete_session_not_found(app_client, monkeypatch):
    table_responses = {"chat_sessions": [[]]}
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)

    response = client.delete("/api/v1/chatbot/sessions/session-1")

    assert response.status_code == 404


def test_delete_session_success(app_client, monkeypatch):
    table_responses = {"chat_sessions": [[{"id": "session-1"}]]}
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)

    response = client.delete("/api/v1/chatbot/sessions/session-1")

    assert response.status_code == 204


def test_get_session_messages_not_found(app_client, monkeypatch):
    table_responses = {"chat_sessions": [[]]}
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)

    response = client.get("/api/v1/chatbot/sessions/session-1/messages")

    assert response.status_code == 404


def test_get_session_messages_success(app_client, monkeypatch):
    table_responses = {
        "chat_sessions": [[{"id": "session-1"}]],
        "chat_messages": [
            [
                {
                    "id": "msg-1",
                    "session_id": "session-1",
                    "role": "user",
                    "content": "Halo",
                    "metadata": None,
                    "created_at": "2026-01-01T00:00:00Z",
                }
            ]
        ],
    }
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)

    response = client.get("/api/v1/chatbot/sessions/session-1/messages")

    assert response.status_code == 200
    assert response.json()["messages"][0]["id"] == "msg-1"


def test_chatbot_triage_validation_error(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.post("/api/v1/chatbot/triage", json={"query": "Hi"})
    assert response.status_code == 422


def test_chatbot_triage_new_session_success(app_client, monkeypatch):
    table_responses = {
        "chat_sessions": [[{"id": "session-1"}]],
        "chat_messages": [[]],
    }
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)
    monkeypatch.setattr(
        chatbot_router, "_auto_generate_title", lambda *args, **kwargs: None
    )
    monkeypatch.setattr(
        chatbot_router,
        "triage",
        lambda **kwargs: {
            "type": "text",
            "jawaban": "Jawaban AI",
            "pasal_referensi": [],
            "disclaimer": "Disclaimer",
        },
    )

    response = client.post("/api/v1/chatbot/triage", json={"query": "Apa itu kontrak?"})

    assert response.status_code == 200
    assert response.json()["jawaban"] == "Jawaban AI"


def test_chatbot_triage_existing_session_success(app_client, monkeypatch):
    table_responses = {
        "chat_sessions": [[{"id": "session-1"}]],
        "chat_messages": [([], 1), [{"role": "user", "content": "Halo"}]],
    }
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)
    monkeypatch.setattr(
        chatbot_router,
        "triage",
        lambda **kwargs: {
            "type": "consultant_list",
            "jawaban": "Daftar konsultan",
            "pasal_referensi": [],
            "consultants": [{"id_konsultan": 1}],
            "disclaimer": "Disclaimer",
        },
    )

    response = client.post(
        "/api/v1/chatbot/triage",
        json={"query": "Perlu konsultan", "session_id": "session-1"},
    )

    assert response.status_code == 200
    assert response.json()["type"] == "consultant_list"
    assert response.json()["consultants"][0]["id_konsultan"] == 1


def test_chatbot_triage_session_not_found(app_client, monkeypatch):
    table_responses = {"chat_sessions": [[]]}
    client, supabase = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    monkeypatch.setattr(chatbot_router, "get_supabase_client", lambda: supabase)

    response = client.post(
        "/api/v1/chatbot/triage",
        json={"query": "Perlu konsultan", "session_id": "missing"},
    )

    assert response.status_code == 404
