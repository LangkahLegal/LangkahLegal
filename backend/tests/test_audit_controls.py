import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-only")
os.environ.setdefault("FRONTEND_URL", "https://langkahlegal.com")

from core.config import get_settings
from core.constants import StatusPengajuan
from core.exceptions import BadRequestError
from services import auth_service, payment_service


class AuditControlTests(unittest.TestCase):
    def test_public_auth_result_excludes_tokens(self):
        result = auth_service.public_auth_result({
            "session": {"access_token": "secret", "refresh_token": "secret"},
            "user": {"id": "user-1"},
        })
        self.assertEqual(result, {"authenticated": True, "user": {"id": "user-1"}})
        self.assertNotIn("session", result)

    def test_cross_origin_redirect_rejected(self):
        with self.assertRaises(BadRequestError):
            auth_service._safe_redirect_url("https://attacker.example/auth/callback")

    def test_same_origin_redirect_allowed(self):
        self.assertEqual(
            auth_service._safe_redirect_url("https://langkahlegal.com/auth/callback"),
            "https://langkahlegal.com/auth/callback",
        )

    def test_cancelled_consultation_is_not_payable(self):
        self.assertNotIn(StatusPengajuan.DIBATALKAN, payment_service.PAYABLE_STATUSES)

    def test_midtrans_production_is_rejected(self):
        previous = os.environ.get("MIDTRANS_IS_PRODUCTION")
        os.environ["MIDTRANS_IS_PRODUCTION"] = "true"
        get_settings.cache_clear()
        try:
            with self.assertRaisesRegex(RuntimeError, "sandbox"):
                get_settings()
        finally:
            if previous is None:
                os.environ.pop("MIDTRANS_IS_PRODUCTION", None)
            else:
                os.environ["MIDTRANS_IS_PRODUCTION"] = previous
            get_settings.cache_clear()


if __name__ == "__main__":
    unittest.main()
