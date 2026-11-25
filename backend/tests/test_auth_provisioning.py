import os
import sys
import unittest
from unittest.mock import AsyncMock, Mock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-only")
os.environ.setdefault("FRONTEND_URL", "https://langkahlegal.com")

from schemas.auth import ForgotPasswordPayload, SignUpPayload
from services import auth_service


class AuthProvisioningTests(unittest.IsolatedAsyncioTestCase):
    async def test_signup_creates_profile(self):
        db = Mock()
        db.auth.admin.delete_user = Mock()
        payload = SignUpPayload(email="demo@example.com", password="password123", name="Demo", role="client")
        auth_data = {"user": {"id": "auth-1"}, "session": None}

        with (
            patch.object(auth_service, "_post_auth", AsyncMock(return_value=auth_data)),
            patch.object(auth_service.user_repository, "list_by_auth_user_id", return_value=[]),
            patch.object(auth_service.user_repository, "insert", return_value=[{"id_user": 1}]) as insert,
        ):
            await auth_service.sign_up(db, payload)

        insert.assert_called_once_with(
            db,
            {"auth_user_id": "auth-1", "email": "demo@example.com", "nama": "Demo", "role": "client"},
        )

    async def test_signup_rolls_back_auth_when_profile_fails(self):
        db = Mock()
        db.auth.admin.delete_user = Mock()
        payload = SignUpPayload(email="demo@example.com", password="password123", name="Demo", role="client")

        with (
            patch.object(auth_service, "_post_auth", AsyncMock(return_value={"user": {"id": "auth-1"}})),
            patch.object(auth_service.user_repository, "list_by_auth_user_id", return_value=[]),
            patch.object(auth_service.user_repository, "insert", side_effect=RuntimeError("db gagal")),
        ):
            with self.assertRaisesRegex(Exception, "Gagal membuat profil"):
                await auth_service.sign_up(db, payload)

        db.auth.admin.delete_user.assert_called_once_with("auth-1")

    async def test_forgot_password_skips_auth_user_without_profile(self):
        db = Mock()
        payload = ForgotPasswordPayload(email="orphan@example.com")
        with (
            patch.object(auth_service.user_repository, "list_by_email", return_value=[]),
            patch.object(auth_service, "_post_auth", AsyncMock()) as post_auth,
        ):
            result = await auth_service.forgot_password(db, payload)

        self.assertEqual(result, {"sent": True})
        post_auth.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
