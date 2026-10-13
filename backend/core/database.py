from functools import lru_cache

from supabase import Client, create_client

from core.config import get_settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def check_db_connection() -> bool:
    try:
        client = get_supabase_client()
        client.table("users").select("id_user").limit(1).execute()
        return True
    except Exception:
        return False
