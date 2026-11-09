"""Log per request chatbot, disimpan sebagai satu file JSON di bucket privat Supabase Storage.

Jejak dikumpulkan lewat ContextVar selama request berjalan, jadi rag_service dan chat_policy cukup memanggil
catat()/catat_gemini() tanpa meneruskan objek ke mana-mana. Isi teks di log adalah versi tersamar, persis
yang dilihat Gemini; teks asli hanya ada di tabel chat_messages.
"""

import json
import logging
import time
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from core.config import get_settings
from core.database import get_supabase_client
from helpers import gemini_errors
from middleware.request_id import request_id_sekarang

logger = logging.getLogger(__name__)

_jejak: ContextVar[Optional[dict]] = ContextVar("chat_log_jejak", default=None)


def mulai(user_id: int, session_id: Optional[str], kategori: Optional[str], preferensi: Optional[dict]) -> None:
    _jejak.set(
        {
            # "-" berarti dipanggil di luar request HTTP, misalnya dari eval.
            "request_id": rid if (rid := request_id_sekarang()) != "-" else uuid4().hex,
            "waktu": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "_mulai": time.perf_counter(),
            "status": "ok",
            "user_id": user_id,
            "session_id": session_id,
            "request": {"query": None, "kategori": kategori, "preferensi": preferensi},
            "gemini": [],
        }
    )


def catat(**data: Any) -> None:
    jejak = _jejak.get()
    if jejak is not None:
        jejak.update(data)


def catat_request(**data: Any) -> None:
    jejak = _jejak.get()
    if jejak is not None:
        jejak["request"].update(data)


def _token(response) -> Optional[dict]:
    usage = getattr(response, "usage_metadata", None)
    if usage is None:
        return None
    return {
        "prompt": usage.prompt_token_count,
        "output": usage.candidates_token_count,
        "total": usage.total_token_count,
    }


def _finish_reason(response) -> Optional[str]:
    try:
        alasan = response.candidates[0].finish_reason
    except (AttributeError, IndexError, TypeError):
        return None
    return getattr(alasan, "name", None) or (str(alasan) if alasan else None)


def catat_gemini(langkah: str, model: str, mulai_ts: float, response=None, error: Optional[Exception] = None) -> None:
    jejak = _jejak.get()
    if jejak is None:
        return
    jejak["gemini"].append(
        {
            "langkah": langkah,
            "model": model,
            "latency_ms": round((time.perf_counter() - mulai_ts) * 1000),
            "token": _token(response) if response is not None else None,
            "finish_reason": _finish_reason(response) if response is not None else None,
            "error": gemini_errors.describe(error) if error is not None else None,
        }
    )


def selesai() -> Optional[dict]:
    jejak = _jejak.get()
    if jejak is None:
        return None
    _jejak.set(None)
    jejak["durasi_ms"] = round((time.perf_counter() - jejak.pop("_mulai")) * 1000)
    return jejak


def _path(jejak: dict) -> str:
    waktu = datetime.fromisoformat(jejak["waktu"])
    sesi = jejak.get("session_id") or "tanpa-sesi"
    return f"{waktu:%Y/%m/%d}/{sesi}/{waktu:%H%M%S}-{jejak['request_id']}.json"


def simpan(jejak: Optional[dict]) -> None:
    """Dijalankan sebagai BackgroundTask setelah respons terkirim. Gagal unggah tidak boleh mengganggu chat."""
    settings = get_settings()
    if not jejak or not settings.chat_log_enabled:
        return
    try:
        isi = json.dumps(jejak, ensure_ascii=False, default=str).encode("utf-8")
        get_supabase_client().storage.from_(settings.supabase_chat_log_bucket).upload(
            _path(jejak), isi, {"content-type": "application/json", "upsert": "false"}
        )
    except Exception as e:
        logger.warning(f"[CHAT_LOG] Gagal menyimpan log {jejak.get('request_id')}: {e}")
