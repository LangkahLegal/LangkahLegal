import pytest
from unittest.mock import MagicMock, patch
import httpx
from services.email_service import get_frontend_base_url, send_recovery_email, send_notification_email
from config import Settings


@pytest.fixture
def mock_settings_no_key():
    return Settings(
        app_env="test",
        app_name="TestApp",
        frontend_url="https://test.langkahlegal.com",
        cookie_domain="localhost",
        supabase_url="https://supabase.co",
        supabase_key="key",
        supabase_portofolio_bucket="port",
        supabase_berkas_pendukung_bucket="berkas",
        supabase_knowledge_bucket="kb",
        imgbb_api_key="img",
        midtrans_server_key="mid_server",
        midtrans_client_key="mid_client",
        midtrans_is_production=False,
        voyage_api_key="voyage",
        google_api_key="google",
        brevo_api_key="",
        brevo_from_email="LangkahLegal <langkahlegal@gmail.com>",
    )


@pytest.fixture
def mock_settings_with_key():
    return Settings(
        app_env="test",
        app_name="TestApp",
        frontend_url="https://test.langkahlegal.com",
        cookie_domain="localhost",
        supabase_url="https://supabase.co",
        supabase_key="key",
        supabase_portofolio_bucket="port",
        supabase_berkas_pendukung_bucket="berkas",
        supabase_knowledge_bucket="kb",
        imgbb_api_key="img",
        midtrans_server_key="mid_server",
        midtrans_client_key="mid_client",
        midtrans_is_production=False,
        voyage_api_key="voyage",
        google_api_key="google",
        brevo_api_key="xkeysib-test-key",
        brevo_from_email="LangkahLegal <langkahlegal@gmail.com>",
    )


def test_send_email_no_api_key(mock_settings_no_key):
    with patch("services.email_service.get_settings", return_value=mock_settings_no_key):
        with patch("httpx.Client") as mock_client_cls:
            send_recovery_email("test@example.com", "http://test-link")
            mock_client_cls.assert_not_called()


def test_send_recovery_email_success(mock_settings_with_key):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"messageId": "msg_12345"}
    mock_client.post.return_value = mock_response

    with patch("services.email_service.get_settings", return_value=mock_settings_with_key):
        with patch("httpx.Client") as mock_client_cls:
            mock_client_cls.return_value.__enter__.return_value = mock_client
            send_recovery_email("client@example.com", "https://reset-link")

            # Check that post was called with correct payload & headers
            mock_client.post.assert_called_once()
            args, kwargs = mock_client.post.call_args
            assert args[0] == "https://api.brevo.com/v3/smtp/email"
            assert kwargs["headers"]["api-key"] == "xkeysib-test-key"
            assert kwargs["json"]["sender"]["name"] == "LangkahLegal"
            assert kwargs["json"]["sender"]["email"] == "langkahlegal@gmail.com"
            assert kwargs["json"]["to"] == [{"email": "client@example.com"}]
            assert "reset-link" in kwargs["json"]["htmlContent"]


def test_send_notification_email_failure(mock_settings_with_key):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.text = "Bad Request"
    mock_client.post.return_value = mock_response

    with patch("services.email_service.get_settings", return_value=mock_settings_with_key):
        with patch("httpx.Client") as mock_client_cls:
            mock_client_cls.return_value.__enter__.return_value = mock_client
            # Should not raise exception
            send_notification_email("user@example.com", "Test Title", "Test Message")
            mock_client.post.assert_called_once()


def test_send_email_exception_handling(mock_settings_with_key):
    mock_client = MagicMock()
    mock_client.post.side_effect = httpx.TimeoutException("Timeout")

    with patch("services.email_service.get_settings", return_value=mock_settings_with_key):
        with patch("httpx.Client") as mock_client_cls:
            mock_client_cls.return_value.__enter__.return_value = mock_client
            # Should handle exception gracefully
            send_notification_email("user@example.com", "Test Title", "Test Message")
            mock_client.post.assert_called_once()


@pytest.mark.parametrize(
    "app_env, expected_url",
    [
        ("development", "http://localhost:3000"),
        ("test", "http://localhost:3000"),
        ("production", "https://langkahlegal.vercel.app"),
        ("staging", "https://langkahlegal.vercel.app"),
    ],
)
def test_get_frontend_base_url(app_env, expected_url):
    settings = Settings(
        app_env=app_env,
        app_name="TestApp",
        frontend_url="https://test.langkahlegal.com",
        cookie_domain="localhost",
        supabase_url="https://supabase.co",
        supabase_key="key",
        supabase_portofolio_bucket="port",
        supabase_berkas_pendukung_bucket="berkas",
        supabase_knowledge_bucket="kb",
        imgbb_api_key="img",
        midtrans_server_key="mid_server",
        midtrans_client_key="mid_client",
        midtrans_is_production=False,
        voyage_api_key="voyage",
        google_api_key="google",
        brevo_api_key="xkeysib-test-key",
        brevo_from_email="LangkahLegal <langkahlegal@gmail.com>",
    )

    with patch("services.email_service.get_settings", return_value=settings):
        assert get_frontend_base_url() == expected_url
