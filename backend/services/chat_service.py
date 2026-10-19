import logging

from fastapi import HTTPException
from supabase import Client

from core.exceptions import InternalError, NotFoundError
from core.user import CurrentUser
from helpers.peraturan_files import get_file_info
from repositories import chat_repository
from schemas.chatbot import (
    CreateSessionRequest,
    MessageListResponse,
    MessageResponse,
    SessionListResponse,
    SessionResponse,
    TriageRequest,
    TriageResponse,
)
from services.rag_service import triage

logger = logging.getLogger(__name__)

CONSULTANT_TYPES = ("consultant_list", "consultation_draft")


def _get_chat_history_from_db(supabase: Client, session_id: str, limit: int = 30) -> list[dict]:
    try:
        rows = chat_repository.list_history(supabase, session_id, limit)
        return [
            {
                "role": msg["role"],
                "content": msg["content"],
                "metadata": msg.get("metadata"),
            }
            for msg in (rows or [])
        ]
    except Exception as e:
        logger.warning(f"[CHATBOT] Gagal ambil history session {session_id}: {e}")
        return []


def _save_message(
    supabase: Client,
    session_id: str,
    role: str,
    content: str,
    metadata: dict = None,
) -> None:
    row = {
        "session_id": session_id,
        "role": role,
        "content": content,
    }
    if metadata:
        row["metadata"] = metadata

    chat_repository.insert_message(supabase, row)


def _auto_generate_title(supabase: Client, session_id: str, user_query: str) -> None:
    from google.genai import types

    from services.rag_service import LLM_MODEL, _get_gemini_client

    try:
        client = _get_gemini_client()
        response = client.models.generate_content(
            model=LLM_MODEL,
            contents=f'Buat judul singkat maksimal 5 kata dalam Bahasa Indonesia untuk percakapan berikut. HANYA teks biasa, TANPA markdown, TANPA tanda bintang, TANPA tanda pagar.\n\nPesan: "{user_query}"\n\nJudul:',
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=20,
            ),
        )
        title = response.text.strip().strip('"').strip("'")
        title = title.replace("*", "").replace("#", "").replace("`", "").replace("_", " ").strip()
        title = title[:100]
        if title:
            chat_repository.update_session_title(supabase, session_id, title)
            logger.info(f"[CHATBOT] Auto-generated title for {session_id}: {title}")
    except Exception as e:
        logger.warning(f"[CHATBOT] Failed to auto-generate title: {e}")


def _to_session_response(session: dict) -> SessionResponse:
    return SessionResponse(
        id=session["id"],
        title=session["title"],
        created_at=session["created_at"],
        updated_at=session["updated_at"],
    )


def create_session(supabase: Client, current_user: CurrentUser, request: CreateSessionRequest) -> SessionResponse:
    created = chat_repository.insert_session(supabase, current_user.id_user, request.title)

    if not created:
        raise InternalError("Gagal membuat sesi baru.")

    return _to_session_response(created[0])


def list_sessions(supabase: Client, current_user: CurrentUser, limit: int = 50) -> SessionListResponse:
    rows = chat_repository.list_sessions(supabase, current_user.id_user, limit)
    return SessionListResponse(sessions=[_to_session_response(s) for s in (rows or [])])


def delete_session(supabase: Client, current_user: CurrentUser, session_id: str) -> None:
    if not chat_repository.list_owned_session(supabase, session_id, current_user.id_user):
        raise NotFoundError(f"Sesi dengan ID {session_id} tidak ditemukan atau Anda tidak memiliki akses.")

    chat_repository.delete_session(supabase, session_id)


def _with_fresh_file_info(metadata: dict | None) -> dict | None:
    # Link naskah resmi disimpan saat pesan dibuat; ambil ulang dari manifest supaya pesan lama ikut punya PDF.
    if not metadata or not metadata.get("sumber_dokumen"):
        return metadata
    sources = [{**s, **get_file_info(s["frbr_uri"])} for s in metadata["sumber_dokumen"] if s.get("frbr_uri")]
    return {**metadata, "sumber_dokumen": sources}


def get_session_messages(supabase: Client, current_user: CurrentUser, session_id: str) -> MessageListResponse:
    if not chat_repository.list_owned_session(supabase, session_id, current_user.id_user):
        raise NotFoundError("Sesi tidak ditemukan.")

    rows = chat_repository.list_messages(supabase, session_id)

    messages = [
        MessageResponse(
            id=m["id"],
            session_id=m["session_id"],
            role=m["role"],
            content=m["content"],
            metadata=_with_fresh_file_info(m.get("metadata")),
            created_at=m["created_at"],
        )
        for m in (rows or [])
    ]

    return MessageListResponse(messages=messages)


def _resolve_session(supabase: Client, current_user: CurrentUser, session_id: str | None) -> tuple[str, bool]:
    if not session_id:
        created = chat_repository.insert_session(supabase, current_user.id_user, "Sesi Konsultasi Baru")
        session_id = created[0]["id"]
        logger.info(f"[CHATBOT] Auto-created session: {session_id}")
        return session_id, True

    if not chat_repository.list_owned_session(supabase, session_id, current_user.id_user):
        raise NotFoundError("Sesi tidak ditemukan.")

    return session_id, chat_repository.count_messages(supabase, session_id) == 0


def _ai_metadata(result: dict, response_type: str) -> dict:
    metadata = {
        "type": response_type,
        "pasal_referensi": result.get("pasal_referensi", []),
        "sumber_dokumen": result.get("sumber_dokumen", []),
        "disclaimer": result.get("disclaimer", ""),
    }
    if response_type in CONSULTANT_TYPES:
        metadata["consultants"] = result.get("consultants", [])
    if result.get("draft_konsultasi"):
        metadata["draft_konsultasi"] = result["draft_konsultasi"]
    return metadata


def _to_triage_response(session_id: str, result: dict, response_type: str) -> TriageResponse:
    return TriageResponse(
        session_id=session_id,
        type=response_type,
        jawaban=result["jawaban"],
        pasal_referensi=result.get("pasal_referensi", []),
        sumber_dokumen=result.get("sumber_dokumen", []),
        consultants=result.get("consultants") if response_type in CONSULTANT_TYPES else None,
        draft_konsultasi=result.get("draft_konsultasi"),
        disclaimer=result.get("disclaimer", ""),
    )


def _is_overload_error(error: Exception) -> bool:
    return any(marker in str(error) for marker in ("429", "503", "UNAVAILABLE", "RESOURCE_EXHAUSTED"))


def run_triage(supabase: Client, current_user: CurrentUser, payload: TriageRequest) -> TriageResponse:
    session_id = payload.session_id
    current_step = "init"
    try:
        current_step = "session_resolve"
        session_id, is_new_session = _resolve_session(supabase, current_user, session_id)

        current_step = "load_history"
        chat_history = _get_chat_history_from_db(supabase, session_id, limit=30)

        current_step = "rag_triage"
        result = triage(
            query=payload.query,
            supabase=supabase,
            kategori=payload.kategori,
            chat_history=chat_history,
        )

        current_step = "save_user_msg"
        response_type = result.get("type", "text")

        _save_message(supabase, session_id, "user", payload.query, metadata={"klasifikasi": result.get("klasifikasi")})

        current_step = "save_ai_msg"
        _save_message(
            supabase,
            session_id,
            "ai",
            result["jawaban"],
            metadata=_ai_metadata(result, response_type),
        )

        current_step = "auto_title"
        if is_new_session:
            _auto_generate_title(supabase, session_id, payload.query)

        current_step = "build_response"
        return _to_triage_response(session_id, result, response_type)

    except HTTPException:
        raise
    except Exception as e:
        if _is_overload_error(e):
            return TriageResponse(
                session_id=session_id if session_id else "",
                type="error",
                jawaban="Sistem AI kami sedang mengalami lonjakan permintaan. Mohon tunggu sekitar 30 detik lalu coba lagi ya! 🙏",
                pasal_referensi=[],
                disclaimer="",
            )

        logger.error(f"[CHATBOT] Error at step '{current_step}': {e}", exc_info=True)
        raise InternalError(
            f"Terjadi kesalahan saat memproses pertanyaan Anda (step: {current_step}). Error: {type(e).__name__}: {str(e)[:300]}"
        )
