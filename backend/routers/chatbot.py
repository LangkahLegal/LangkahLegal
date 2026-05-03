"""
LangkahLegal Chatbot Router
============================
Endpoints untuk chatbot AI berbasis RAG + Persistensi History.

CRUD Sesi & Pesan:
  - POST   /sessions              → Buat sesi baru
  - GET    /sessions              → Daftar sesi milik user
  - DELETE /sessions/{session_id} → Hapus sesi
  - GET    /sessions/{session_id}/messages → Riwayat chat
  
RAG Pipeline:
  - POST   /triage                → Kirim pesan + generate jawaban AI
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from rag_service import triage

log = logging.getLogger(__name__)

router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

# --- Session ---
class CreateSessionRequest(BaseModel):
    title: Optional[str] = Field(
        "Sesi Konsultasi Baru",
        max_length=100,
        description="Judul sesi (opsional, bisa di-auto-generate dari pesan pertama)",
    )


class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]


# --- Messages ---
class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    metadata: Optional[dict] = None
    created_at: str


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]


# --- Triage ---
class TriageRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Pertanyaan hukum dari pengguna",
        examples=["Apa hukuman untuk pencurian?"],
    )
    session_id: Optional[str] = Field(
        None,
        description="ID sesi. Jika null, backend akan membuat sesi baru secara otomatis.",
    )
    kategori: Optional[str] = Field(
        None,
        description="Filter kategori hukum (opsional)",
    )


class PasalReference(BaseModel):
    nama_uu: Optional[str] = ""
    nomor_uu: Optional[str] = ""
    pasal_bagian: str
    judul_bab: Optional[str] = None
    similarity: float


class TriageResponse(BaseModel):
    session_id: str
    jawaban: str
    pasal_referensi: list[PasalReference]
    disclaimer: str


# ============================================================
# HELPER: Get chat history from DB
# ============================================================

def _get_chat_history_from_db(supabase: Client, session_id: str, limit: int = 10) -> list[dict]:
    """
    Ambil riwayat chat dari database berdasarkan session_id.
    Menggantikan pengiriman chat_history dari frontend.
    """
    try:
        result = (
            supabase.table("chat_messages")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        # Convert ke format yang diharapkan rag_service
        return [
            {"role": msg["role"], "text": msg["content"]}
            for msg in (result.data or [])
        ]
    except Exception as e:
        log.warning(f"[CHATBOT] Failed to get history for session {session_id}: {e}")
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
        # Strip all markdown artifacts
        title = response.text.strip().strip('"').strip("'")
        title = title.replace("*", "").replace("#", "").replace("`", "").replace("_", " ").strip()
        title = title[:100]
        if title:
            supabase.table("chat_sessions").update({"title": title}).eq("id", session_id).execute()
            log.info(f"[CHATBOT] Auto-generated title for {session_id}: {title}")
    except Exception as e:
        log.warning(f"[CHATBOT] Failed to auto-generate title: {e}")


# ============================================================
# ENDPOINTS: Session CRUD
# ============================================================

@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat sesi konsultasi baru",
)
async def create_session(
    request: CreateSessionRequest = CreateSessionRequest(),
    current_user: dict = Depends(get_current_user),
):
    """Membuat sesi chat baru untuk user yang sedang login."""
    supabase = get_supabase_client()
    
    result = (
        supabase.table("chat_sessions")
        .insert({
            "user_id": current_user["id_user"],
            "title": request.title,
        })
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Gagal membuat sesi baru.")
    
    session = result.data[0]
    return SessionResponse(
        id=session["id"],
        title=session["title"],
        created_at=session["created_at"],
        updated_at=session["updated_at"],
    )


@router.get(
    "/sessions",
    response_model=SessionListResponse,
    summary="Daftar sesi konsultasi user",
)
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
):
    """Mengambil daftar sesi chat milik user, diurutkan dari yang terbaru."""
    supabase = get_supabase_client()
    
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


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Hapus sesi konsultasi",
)
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Menghapus sesi chat beserta semua pesannya (cascade delete)."""
    supabase = get_supabase_client()
    
    # Verify ownership
    check = (
        supabase.table("chat_sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", current_user["id_user"])
        .execute()
    )
    
    if not check.data:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    
    supabase.table("chat_sessions").delete().eq("id", session_id).execute()


# ============================================================
# ENDPOINTS: Messages
# ============================================================

@router.get(
    "/sessions/{session_id}/messages",
    response_model=MessageListResponse,
    summary="Riwayat chat dalam satu sesi",
)
async def get_session_messages(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Mengambil seluruh pesan dalam satu sesi, diurutkan dari yang terlama."""
    supabase = get_supabase_client()
    
    # Verify ownership
    check = (
        supabase.table("chat_sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", current_user["id_user"])
        .execute()
    )
    
    if not check.data:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    
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


# ============================================================
# ENDPOINT: Triage (RAG Pipeline + Persistence)
# ============================================================

@router.post(
    "/triage",
    response_model=TriageResponse,
    summary="Chatbot RAG Triage",
    description="""
Endpoint utama chatbot LangkahLegal. Menerima pertanyaan hukum dari pengguna,
mencari pasal-pasal yang relevan, dan menghasilkan jawaban AI.

**Perubahan dari versi sebelumnya:**
- Backend TIDAK lagi menerima `chat_history` dari frontend
- Backend mengambil riwayat chat dari database berdasarkan `session_id`
- Setelah AI menjawab, pesan user + AI otomatis tersimpan ke database
- Jika `session_id` kosong, backend membuat sesi baru secara otomatis
""",
)
async def chatbot_triage(
    request: TriageRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Pipeline:
    1. Resolve/create session
    2. Load chat history from DB
    3. Run RAG triage
    4. Save user message + AI response to DB
    5. Auto-generate title if first message
    """
    try:
        supabase = get_supabase_client()
        session_id = request.session_id
        is_new_session = False
        
        # Step 1: Resolve session
        if not session_id:
            # Create a new session automatically
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
            # Verify ownership of existing session
            check = (
                supabase.table("chat_sessions")
                .select("id")
                .eq("id", session_id)
                .eq("user_id", current_user["id_user"])
                .execute()
            )
            if not check.data:
                raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
            
            # Check if this is the first message (for title auto-gen)
            msg_count = (
                supabase.table("chat_messages")
                .select("id", count="exact")
                .eq("session_id", session_id)
                .execute()
            )
            is_new_session = (msg_count.count or 0) == 0
        
        # Step 2: Load chat history from DB (NOT from frontend)
        chat_history = _get_chat_history_from_db(supabase, session_id, limit=10)
        
        # Step 3: Run RAG pipeline
        result = triage(
            query=request.query,
            supabase=supabase,
            kategori=request.kategori,
            chat_history=chat_history,
        )
        
        # Step 4: Save messages to DB
        _save_message(supabase, session_id, "user", request.query)
        _save_message(
            supabase,
            session_id,
            "ai",
            result["jawaban"],
            metadata={
                "pasal_referensi": result.get("pasal_referensi", []),
                "disclaimer": result.get("disclaimer", ""),
            },
        )
        
        # Step 5: Auto-generate title for first message
        if is_new_session:
            _auto_generate_title(supabase, session_id, request.query)
        
        return TriageResponse(
            session_id=session_id,
            jawaban=result["jawaban"],
            pasal_referensi=result.get("pasal_referensi", []),
            disclaimer=result.get("disclaimer", ""),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"[CHATBOT] Error processing triage: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.",
        )
