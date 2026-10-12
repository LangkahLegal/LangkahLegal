from fastapi import APIRouter, Depends, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.database import get_supabase_client
from core.dependencies import get_current_user
from schemas.chatbot import (
    CreateSessionRequest,
    SessionResponse,
    SessionListResponse,
    MessageListResponse,
    TriageRequest,
    TriageResponse,
)
from services import chat_service
from docs import chatbot as docs

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    **docs.CREATE_SESSION,
)
async def create_session(
    request: CreateSessionRequest = CreateSessionRequest(),
    current_user: dict = Depends(get_current_user),
):
    return chat_service.create_session(get_supabase_client(), current_user, request)


@router.get("/sessions", response_model=SessionListResponse, **docs.LIST_SESSIONS)
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
):
    return chat_service.list_sessions(get_supabase_client(), current_user, limit)


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    **docs.DELETE_SESSION,
)
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    chat_service.delete_session(get_supabase_client(), current_user, session_id)


@router.get(
    "/sessions/{session_id}/messages",
    response_model=MessageListResponse,
    **docs.GET_SESSION_MESSAGES,
)
async def get_session_messages(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    return chat_service.get_session_messages(get_supabase_client(), current_user, session_id)

@router.post("/triage", response_model=TriageResponse, **docs.CHATBOT_TRIAGE)
@limiter.limit("3/minute")
async def chatbot_triage(
    request: Request,
    payload: TriageRequest,
    current_user: dict = Depends(get_current_user),
):
    return chat_service.run_triage(get_supabase_client(), current_user, payload)
