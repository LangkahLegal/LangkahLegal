import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()
@dataclass(frozen=True)
class Settings:
	app_env: str
	app_name: str
	supabase_url: str
	supabase_key: str
	supabase_portofolio_bucket: str
	imgbb_api_key: str

@lru_cache(maxsize=1)
def get_settings() -> Settings:
	supabase_url = os.getenv("SUPABASE_URL", "").strip()
	supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip() or os.getenv("SUPABASE_KEY", "").strip()
	imgbb_api_key = os.getenv("IMGBB_API_KEY", "").strip()
	portofolio_bucket = os.getenv("SUPABASE_PORTOFOLIO_BUCKET", "portofolio").strip() or "portofolio"

	if not supabase_url or not supabase_key:
		raise RuntimeError(
			"Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)."
		)
	
	if not imgbb_api_key:
		raise RuntimeError(
			"Missing required environment variable: IMGBB_API_KEY"
		)

	return Settings(
		app_env=os.getenv("APP_ENV", "development").strip(),
		app_name=os.getenv("APP_NAME", "LangkahLegal Backend").strip(),
		supabase_url=supabase_url,
		supabase_key=supabase_key,
		supabase_portofolio_bucket=portofolio_bucket,
		imgbb_api_key=imgbb_api_key,
	)
