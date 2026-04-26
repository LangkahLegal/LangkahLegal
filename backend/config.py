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
	supabase_berkas_pendukung_bucket: str
	supabase_knowledge_bucket: str
	imgbb_api_key: str
	midtrans_server_key: str
	midtrans_client_key: str
	midtrans_is_production: bool

@lru_cache(maxsize=1)
def get_settings() -> Settings:
	supabase_url = os.getenv("SUPABASE_URL", "").strip()
	supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip() or os.getenv("SUPABASE_KEY", "").strip()
	imgbb_api_key = os.getenv("IMGBB_API_KEY", "").strip()
	portofolio_bucket = os.getenv("SUPABASE_PORTOFOLIO_BUCKET", "portofolio").strip() or "portofolio"
	berkas_pendukung_bucket = os.getenv("SUPABASE_BERKAS_PENDUKUNG_BUCKET", "berkas-pendukung").strip() or "berkas-pendukung"
	knowledge_bucket = os.getenv("SUPABASE_KNOWLEDGE_BUCKET", "knowledge-base").strip() or "knowledge-base"
	midtrans_server_key = os.getenv("MIDTRANS_SERVER_KEY", "").strip()
	midtrans_client_key = os.getenv("MIDTRANS_CLIENT_KEY", "").strip()
	midtrans_is_production = os.getenv("MIDTRANS_IS_PRODUCTION", "false").strip().lower() == "true"

	if not supabase_url or not supabase_key:
		raise RuntimeError(
			"Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)."
		)
	
	return Settings(
		app_env=os.getenv("APP_ENV", "development").strip(),
		app_name=os.getenv("APP_NAME", "LangkahLegal Backend").strip(),
		supabase_url=supabase_url,
		supabase_key=supabase_key,
		supabase_portofolio_bucket=portofolio_bucket,
		supabase_berkas_pendukung_bucket=berkas_pendukung_bucket,
		supabase_knowledge_bucket=knowledge_bucket,
		imgbb_api_key=imgbb_api_key,
		midtrans_server_key=midtrans_server_key,
		midtrans_client_key=midtrans_client_key,
		midtrans_is_production=midtrans_is_production,
	)
