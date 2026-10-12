import logging

from fastapi import HTTPException
from supabase import Client

from exceptions import InternalError, NotFoundError
from rag_service import triage
from schemas.chatbot import (
    CreateSessionRequest,
    MessageListResponse,
    MessageResponse,
    SessionListResponse,
    SessionResponse,
    TriageRequest,
    TriageResponse,
)

log = logging.getLogger(__name__)


def _get_chat_history_from_db(supabase: Client, session_id: str, limit: int = 30) -> list[dict]:
    """Ambil riwayat chat dari DB, termasuk metadata (untuk konteks konsultan)."""
    try:
        result = (
            supabase.table("chat_messages")
            .select("role, content, metadata")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return [
            {
                "role": msg["role"],
                "content": msg["content"],
                "metadata": msg.get("metadata"),
            }
            for msg in (result.data or [])
        ]
    except Exception as e:
        log.warning(f"[CHATBOT] Gagal ambil history session {session_id}: {e}")
        return []


def _save_message(
    supabase: Client,
    session_id: str,
    role: str,
    content: str,
    metadata: dict = None,
) -> None:
    """Simpan pesan ke tabel chat_messages."""
    row = {
        "session_id": session_id,
        "role": role,
        "content": content,
    }
    if metadata:
        row["metadata"] = metadata

    supabase.table("chat_messages").insert(row).execute()


def _auto_generate_title(supabase: Client, session_id: str, user_query: str) -> None:
    """
    Background: Generate judul sesi dari pesan pertama user menggunakan LLM.
    Dipanggil hanya jika ini adalah pesan pertama di sesi ini.
    """
    from rag_service import _get_gemini_client, LLM_MODEL
    from google.genai import types

    try:
        client = _get_gemini_client()
        response = client.models.generate_content(
            model=LLM_MODEL,
            contents=f"Buat judul singkat maksimal 5 kata dalam Bahasa Indonesia untuk percakapan berikut. HANYA teks biasa, TANPA markdown, TANPA tanda bintang, TANPA tanda pagar.\n\nPesan: \"{user_query}\"\n\nJudul:",
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=20,
            ),
        )
        title = response.text.strip().strip('"').strip("'")
        title = title.replace("*", "").replace("#", "").replace("`", "").replace("_", " ").strip()
        title = title[:100]
        if title:
            supabase.table("chat_sessions").update({"title": title}).eq("id", session_id).execute()
            log.info(f"[CHATBOT] Auto-generated title for {session_id}: {title}")
    except Exception as e:
        log.warning(f"[CHATBOT] Failed to auto-generate title: {e}")


def create_session(
    supabase: Client, current_user: dict, request: CreateSessionRequest
) -> SessionResponse:
    result = (
        supabase.table("chat_sessions")
        .insert({
            "user_id": current_user["id_user"],
            "title": request.title,
        })
        .execute()
    )

    if not result.data:
        raise InternalError("Gagal membuat sesi baru.")

    session = result.data[0]
    return SessionResponse(
        id=session["id"],
        title=session["title"],
        created_at=session["created_at"],
        updated_at=session["updated_at"],
    )


def list_sessions(supabase: Client, current_user: dict, limit: int = 50) -> SessionListResponse:
    result = (
        supabase.table("chat_sessions")
        .select("id, title, created_at, updated_at")
        .eq("user_id", current_user["id_user"])
        .order("updated_at", desc=True)
        .limit(limit)
        .execute()
    )

    sessions = [
        SessionResponse(
            id=s["id"],
            title=s["title"],
            created_at=s["created_at"],
            updated_at=s["updated_at"],
        )
        for s in (result.data or [])
    ]

    return SessionListResponse(sessions=sessions)


def delete_session(supabase: Client, current_user: dict, session_id: str) -> None:
    check = (
        supabase.table("chat_sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", current_user["id_user"])
        .execute()
    )

    if not check.data:
        raise NotFoundError(f"Sesi dengan ID {session_id} tidak ditemukan atau Anda tidak memiliki akses.")

    supabase.table("chat_sessions").delete().eq("id", session_id).execute()


def get_session_messages(
    supabase: Client, current_user: dict, session_id: str
) -> MessageListResponse:
    check = (
        supabase.table("chat_sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", current_user["id_user"])
        .execute()
    )

    if not check.data:
        raise NotFoundError("Sesi tidak ditemukan.")

    result = (
        supabase.table("chat_messages")
        .select("id, session_id, role, content, metadata, created_at")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )

    messages = [
        MessageResponse(
            id=m["id"],
            session_id=m["session_id"],
            role=m["role"],
            content=m["content"],
            metadata=m.get("metadata"),
            created_at=m["created_at"],
        )
        for m in (result.data or [])
    ]

    return MessageListResponse(messages=messages)


def run_triage(supabase: Client, current_user: dict, payload: TriageRequest) -> TriageResponse:
    """
    Pipeline:
    1. Resolve/create session
    2. Load chat history from DB
    3. Run RAG triage
    4. Save user message + AI response to DB
    5. Auto-generate title if first message
    """
    session_id = payload.session_id
    current_step = "init"
    try:
        is_new_session = False

        current_step = "session_resolve"
        if not session_id:
            session_result = (
                supabase.table("chat_sessions")
                .insert({
                    "user_id": current_user["id_user"],
                    "title": "Sesi Konsultasi Baru",
                })
                .execute()
            )
            session_id = session_result.data[0]["id"]
            is_new_session = True
            log.info(f"[CHATBOT] Auto-created session: {session_id}")
        else:
            check = (
                supabase.table("chat_sessions")
                .select("id")
                .eq("id", session_id)
                .eq("user_id", current_user["id_user"])
                .execute()
            )
            if not check.data:
                raise NotFoundError("Sesi tidak ditemukan.")

            msg_count = (
                supabase.table("chat_messages")
                .select("id", count="exact")
                .eq("session_id", session_id)
                .execute()
            )
            is_new_session = (msg_count.count or 0) == 0

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

        _save_message(supabase, session_id, "user", payload.query)

        current_step = "save_ai_msg"
        ai_metadata = {
            "type": response_type,
            "pasal_referensi": result.get("pasal_referensi", []),
            "sumber_dokumen": result.get("sumber_dokumen", []),
            "disclaimer": result.get("disclaimer", ""),
        }
        if response_type == "consultant_list":
            ai_metadata["consultants"] = result.get("consultants", [])

        _save_message(
            supabase,
            session_id,
            "ai",
            result["jawaban"],
            metadata=ai_metadata,
        )

        current_step = "auto_title"
        if is_new_session:
            _auto_generate_title(supabase, session_id, payload.query)

        current_step = "build_response"
        return TriageResponse(
            session_id=session_id,
            type=response_type,
            jawaban=result["jawaban"],
            pasal_referensi=result.get("pasal_referensi", []),
            sumber_dokumen=result.get("sumber_dokumen", []),
            consultants=result.get("consultants") if response_type == "consultant_list" else None,
            disclaimer=result.get("disclaimer", ""),
        )

    except HTTPException:
        raise
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "503" in err_str or "UNAVAILABLE" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            return TriageResponse(
                session_id=session_id if session_id else "",
                type="error",
                jawaban="Sistem AI kami sedang mengalami lonjakan permintaan. Mohon tunggu sekitar 30 detik lalu coba lagi ya! 🙏",
                pasal_referensi=[],
                disclaimer="",
            )

        log.error(f"[CHATBOT] Error at step '{current_step}': {e}", exc_info=True)
        raise InternalError(
            f"Terjadi kesalahan saat memproses pertanyaan Anda (step: {current_step}). Error: {type(e).__name__}: {str(e)[:300]}"
        )
