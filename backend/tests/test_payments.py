from routers import payments as payments_router


class DummySnap:
    def __init__(self, token="snap-token", redirect_url="http://example.com/pay"):
        self._token = token
        self._redirect_url = redirect_url

    def create_transaction(self, params):
        return {"token": self._token, "redirect_url": self._redirect_url}


class DummyTransactions:
    def __init__(
        self, status_response=None, notification_response=None, status_error=None
    ):
        self._status_response = status_response
        self._notification_response = notification_response
        self._status_error = status_error

    def status(self, order_id):
        if self._status_error:
            raise self._status_error
        return self._status_response or {}

    def notification(self, payload):
        if isinstance(self._notification_response, Exception):
            raise self._notification_response
        return self._notification_response or {}


class DummyCoreApi:
    def __init__(
        self, status_response=None, notification_response=None, status_error=None
    ):
        self.transactions = DummyTransactions(
            status_response=status_response,
            notification_response=notification_response,
            status_error=status_error,
        )


def test_create_transaction_success(app_client, monkeypatch):
    table_responses = {
        "pengajuan_konsultasi": [
            [
                {
                    "id_pengajuan": 1,
                    "status_pengajuan": "menunggu_pembayaran",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "konsultan": {"tarif_per_sesi": 1000},
                    "users": {"nama": "Client", "email": "client@example.com"},
                }
            ]
        ],
        "transaksi": [[], []],
    }

    monkeypatch.setattr(
        payments_router, "_get_snap_client", lambda settings: DummySnap()
    )

    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/payments/create-transaction",
        json={"id_pengajuan": 1},
    )

    assert response.status_code == 201
    assert response.json()["snap_token"] == "snap-token"


def test_create_transaction_validation_error(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "client"})
    response = client.post("/api/v1/payments/create-transaction", json={})
    assert response.status_code == 422


def test_create_transaction_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "konsultan"})
    response = client.post(
        "/api/v1/payments/create-transaction",
        json={"id_pengajuan": 1},
    )
    assert response.status_code == 403


def test_create_transaction_not_found(app_client):
    table_responses = {"pengajuan_konsultasi": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/payments/create-transaction",
        json={"id_pengajuan": 99},
    )

    assert response.status_code == 404


def test_create_transaction_invalid_status(app_client):
    table_responses = {
        "pengajuan_konsultasi": [
            [
                {
                    "id_pengajuan": 1,
                    "status_pengajuan": "selesai",
                    "konsultan": {"tarif_per_sesi": 1000},
                    "users": {"nama": "Client", "email": "client@example.com"},
                }
            ]
        ],
        "transaksi": [[]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/payments/create-transaction",
        json={"id_pengajuan": 1},
    )

    assert response.status_code == 400


def test_create_transaction_existing_pending_returns_token(app_client, monkeypatch):
    table_responses = {
        "pengajuan_konsultasi": [
            [
                {
                    "id_pengajuan": 1,
                    "status_pengajuan": "menunggu_pembayaran",
                    "jam_mulai": "09:00",
                    "jam_selesai": "10:00",
                    "konsultan": {"tarif_per_sesi": 1000},
                    "users": {"nama": "Client", "email": "client@example.com"},
                }
            ]
        ],
        "transaksi": [
            [
                {
                    "order_id": "order-1",
                    "snap_token": "snap-old",
                    "snap_redirect_url": "http://example.com/old",
                }
            ]
        ],
    }

    monkeypatch.setattr(
        payments_router,
        "_get_core_api_client",
        lambda settings: DummyCoreApi(
            status_response={"transaction_status": "pending"}
        ),
    )

    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/payments/create-transaction",
        json={"id_pengajuan": 1},
    )

    assert response.status_code == 201
    assert response.json()["snap_token"] == "snap-old"


def test_create_transaction_tarif_missing(app_client):
    table_responses = {
        "pengajuan_konsultasi": [
            [
                {
                    "id_pengajuan": 1,
                    "status_pengajuan": "menunggu_pembayaran",
                    "konsultan": {"tarif_per_sesi": 0},
                    "users": {"nama": "Client", "email": "client@example.com"},
                }
            ]
        ],
        "transaksi": [[]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post(
        "/api/v1/payments/create-transaction",
        json={"id_pengajuan": 1},
    )

    assert response.status_code == 400


def test_midtrans_notification_invalid_json(app_client):
    client, _ = app_client()
    response = client.post(
        "/api/v1/payments/notification",
        data="not-json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400


def test_midtrans_notification_order_not_found(app_client, monkeypatch):
    table_responses = {"transaksi": [[]]}

    monkeypatch.setattr(
        payments_router,
        "_get_core_api_client",
        lambda settings: DummyCoreApi(
            notification_response={
                "order_id": "order-1",
                "transaction_status": "settlement",
                "fraud_status": "accept",
                "payment_type": "bank",
            }
        ),
    )

    client, _ = app_client(table_responses=table_responses)
    response = client.post("/api/v1/payments/notification", json={"test": "ok"})

    assert response.status_code == 200
    assert response.json()["message"] == "Order not found, ignored"


def test_midtrans_notification_updates_status(app_client, monkeypatch):
    table_responses = {
        "transaksi": [
            [{"id_pengajuan": 1, "status_pembayaran": "pending"}],
            [],
        ],
        "pengajuan_konsultasi": [[]],
    }

    monkeypatch.setattr(
        payments_router,
        "_get_core_api_client",
        lambda settings: DummyCoreApi(
            notification_response={
                "order_id": "order-1",
                "transaction_status": "settlement",
                "fraud_status": "accept",
                "payment_type": "bank",
                "transaction_id": "tx-1",
            }
        ),
    )

    client, _ = app_client(table_responses=table_responses)
    response = client.post("/api/v1/payments/notification", json={"test": "ok"})

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_payment_status_forbidden(app_client):
    table_responses = {
        "pengajuan_konsultasi": [[{"id_pengajuan": 1, "id_user": 2, "id_konsultan": 3}]]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/payments/status/1")

    assert response.status_code == 403


def test_get_payment_status_success(app_client):
    table_responses = {
        "pengajuan_konsultasi": [
            [{"id_pengajuan": 1, "id_user": 1, "id_konsultan": 3}]
        ],
        "transaksi": [[{"id_transaksi": 10, "status_pembayaran": "pending"}]],
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.get("/api/v1/payments/status/1")

    assert response.status_code == 200
    assert response.json()["data"]["id_transaksi"] == 10


def test_sync_payment_status_forbidden(app_client):
    client, _ = app_client(current_user={"id_user": 1, "role": "konsultan"})
    response = client.post("/api/v1/payments/sync/1")
    assert response.status_code == 403


def test_sync_payment_status_not_found(app_client):
    table_responses = {"transaksi": [[]]}
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    response = client.post("/api/v1/payments/sync/1")
    assert response.status_code == 404


def test_sync_payment_status_final(app_client):
    table_responses = {
        "transaksi": [[{"order_id": "order-1", "status_pembayaran": "settlement"}]]
    }
    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )
    response = client.post("/api/v1/payments/sync/1")
    assert response.status_code == 200
    assert response.json()["synced"] is False


def test_sync_payment_status_updates(app_client, monkeypatch):
    table_responses = {
        "transaksi": [
            [{"order_id": "order-1", "status_pembayaran": "pending"}],
            [],
        ],
        "pengajuan_konsultasi": [[]],
    }

    monkeypatch.setattr(
        payments_router,
        "_get_core_api_client",
        lambda settings: DummyCoreApi(
            status_response={
                "transaction_status": "settlement",
                "fraud_status": "accept",
                "payment_type": "bank",
            }
        ),
    )

    client, _ = app_client(
        table_responses=table_responses,
        current_user={"id_user": 1, "role": "client"},
    )

    response = client.post("/api/v1/payments/sync/1")

    assert response.status_code == 200
    assert response.json()["synced"] is True
