import voyageai

from core.config import get_settings


def get_voyage_client() -> voyageai.Client:
    return voyageai.Client(api_key=get_settings().voyage_api_key or None)
