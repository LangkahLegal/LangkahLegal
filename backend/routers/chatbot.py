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

from fastapi import APIRouter, Depends, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_supabase_client
from dependencies import get_current_user
from schemas.chatbot import (
    CreateSessionRequest,
    SessionResponse,
    SessionListResponse,
    MessageListResponse,
    TriageRequest,
    TriageResponse,
)
from services import chat_service

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


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
    return chat_service.create_session(get_supabase_client(), current_user, request)


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
    return chat_service.list_sessions(get_supabase_client(), current_user, limit)


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
    chat_service.delete_session(get_supabase_client(), current_user, session_id)


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
    return chat_service.get_session_messages(get_supabase_client(), current_user, session_id)

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
@limiter.limit("3/minute")
async def chatbot_triage(
    request: Request,
    payload: TriageRequest,
    current_user: dict = Depends(get_current_user),
):
    return chat_service.run_triage(get_supabase_client(), current_user, payload)
