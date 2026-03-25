from functools import lru_cache
from typing import Generator

from supabase import Client, create_client

from config import get_settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def get_db() -> Generator[Client, None, None]:
    yield get_supabase_client()


def check_db_connection() -> bool:
    try:
        client = get_supabase_client()
        client.table("users").select("id_user").limit(1).execute()
        return True
    except Exception:
        return False