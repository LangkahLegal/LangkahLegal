from fastapi import APIRouter, Depends, status

from core.database import get_supabase_client
from core.user import CurrentUser
from docs import chatbot as docs
from middleware import get_current_user, throttle
from schemas.chatbot import (
    CreateSessionRequest,
    MessageListResponse,
    SessionListResponse,
    SessionResponse,
    TriageRequest,
    TriageResponse,
)
from services import chat_service

router = APIRouter()


@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    **docs.CREATE_SESSION,
)
async def create_session(
    request: CreateSessionRequest = CreateSessionRequest(),
    current_user: CurrentUser = Depends(get_current_user),
):
    return chat_service.create_session(get_supabase_client(), current_user, request)


@router.get("/sessions", response_model=SessionListResponse, **docs.LIST_SESSIONS)
async def list_sessions(
    current_user: CurrentUser = Depends(get_current_user),
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
    current_user: CurrentUser = Depends(get_current_user),
):
    chat_service.delete_session(get_supabase_client(), current_user, session_id)


@router.get(
    "/sessions/{session_id}/messages",
    response_model=MessageListResponse,
    **docs.GET_SESSION_MESSAGES,
)
async def get_session_messages(
    session_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    return chat_service.get_session_messages(get_supabase_client(), current_user, session_id)


@router.post(
    "/triage",
    response_model=TriageResponse,
    dependencies=[Depends(throttle("3/minute", per_user=True))],
    **docs.CHATBOT_TRIAGE,
)
async def chatbot_triage(
    payload: TriageRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    return chat_service.run_triage(get_supabase_client(), current_user, payload)
