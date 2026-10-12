from supabase import Client

SESSIONS = "chat_sessions"
MESSAGES = "chat_messages"


def insert_session(db: Client, user_id: int, title: str) -> list[dict]:
    return db.table(SESSIONS).insert({"user_id": user_id, "title": title}).execute().data


def list_sessions(db: Client, user_id: int, limit: int) -> list[dict]:
    return (
        db.table(SESSIONS)
        .select("id, title, created_at, updated_at")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )


def list_owned_session(db: Client, session_id: str, user_id: int) -> list[dict]:
    return (
        db.table(SESSIONS)
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
        .data
    )


def update_session_title(db: Client, session_id: str, title: str) -> None:
    db.table(SESSIONS).update({"title": title}).eq("id", session_id).execute()


def delete_session(db: Client, session_id: str) -> None:
    db.table(SESSIONS).delete().eq("id", session_id).execute()


def count_messages(db: Client, session_id: str) -> int:
    result = db.table(MESSAGES).select("id", count="exact").eq("session_id", session_id).execute()
    return result.count or 0


def list_history(db: Client, session_id: str, limit: int) -> list[dict]:
    return (
        db.table(MESSAGES)
        .select("role, content, metadata")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
        .data
    )


def list_messages(db: Client, session_id: str) -> list[dict]:
    return (
        db.table(MESSAGES)
        .select("id, session_id, role, content, metadata, created_at")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
        .data
    )


def insert_message(db: Client, row: dict) -> None:
    db.table(MESSAGES).insert(row).execute()
