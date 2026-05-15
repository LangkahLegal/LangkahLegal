import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from main import app  # noqa: E402
from database import get_supabase_client  # noqa: E402
from dependencies import get_current_user  # noqa: E402


class MockResponse:
    def __init__(self, data, count=None):
        self.data = data
        self.count = count

    def dict(self):
        return {"data": self.data}


class TableQueue:
    def __init__(self, responses):
        self._responses = list(responses)

    def pop(self):
        if self._responses:
            return self._responses.pop(0)
        return []


class MockTable:
    def __init__(self, queue):
        self._queue = queue
        self.last_payload = None

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def ilike(self, *args, **kwargs):
        return self

    def in_(self, *args, **kwargs):
        return self

    def neq(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def single(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def insert(self, payload):
        self.last_payload = payload
        return self

    def update(self, payload):
        self.last_payload = payload
        return self

    def delete(self, *args, **kwargs):
        return self

    def upsert(self, payload, on_conflict=None):
        self.last_payload = payload
        return self

    def execute(self):
        raw = self._queue.pop()
        if isinstance(raw, tuple) and len(raw) == 2:
            data, count = raw
            return MockResponse(data, count=count)
        return MockResponse(raw)


class MockAuthUser:
    def __init__(self, user_id, email, user_metadata=None):
        self.id = user_id
        self.email = email
        self.user_metadata = user_metadata or {}


class MockAuthResult:
    def __init__(self, user):
        self.user = user


class MockAuth:
    def __init__(self, user=None, error=None):
        self._user = user
        self._error = error

    def get_user(self, token):
        if self._error:
            raise self._error
        return MockAuthResult(self._user)


class MockStorageBucket:
    def __init__(self, bucket_name):
        self.bucket_name = bucket_name

    def upload(self, path, data, options=None):
        return {"path": path, "bucket": self.bucket_name}

    def remove(self, paths):
        return {"paths": paths}

    def get_public_url(self, path):
        return f"https://example.com/storage/{self.bucket_name}/{path}"


class MockStorage:
    def from_(self, bucket_name):
        return MockStorageBucket(bucket_name)


class MockSupabase:
    def __init__(self, table_responses=None, auth_user=None, auth_error=None):
        self._table_queues = {}
        self._table_responses = table_responses or {}
        self.auth = MockAuth(user=auth_user, error=auth_error)
        self.storage = MockStorage()

    def table(self, name):
        queue = self._table_queues.get(name)
        if queue is None:
            queue = TableQueue(self._table_responses.get(name, []))
            self._table_queues[name] = queue
        return MockTable(queue)


@pytest.fixture
def app_client():
    def _make_client(
        table_responses=None,
        auth_user=None,
        auth_error=None,
        current_user=None,
    ):
        supabase = MockSupabase(
            table_responses=table_responses or {},
            auth_user=auth_user,
            auth_error=auth_error,
        )
        app.dependency_overrides[get_supabase_client] = lambda: supabase
        if current_user is not None:
            app.dependency_overrides[get_current_user] = lambda: current_user
        else:
            app.dependency_overrides.pop(get_current_user, None)
        return TestClient(app), supabase

    yield _make_client
    app.dependency_overrides = {}
