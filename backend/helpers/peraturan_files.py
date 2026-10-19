import json
from functools import lru_cache
from pathlib import Path

MANIFEST_PATH = Path(__file__).resolve().parent.parent / "data" / "peraturan_files.json"

# Status dari tools/sync_peraturan_files.py yang aman ditampilkan ke user. "isi_tidak_cocok" sengaja tidak
# termasuk: PDF-nya peraturan lain, jadi menautkannya justru menyesatkan.
TRUSTED_STATUSES = {"terupload", "terlalu_besar"}


@lru_cache(maxsize=1)
def _manifest() -> dict[str, dict]:
    try:
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}


def get_file_info(frbr_uri: str) -> dict:
    """Naskah resmi sebuah dokumen: PDF di Cloudinary dan halaman sumbernya di JDIH BPK."""
    entry = _manifest().get(frbr_uri)
    if not entry or entry.get("status") not in TRUSTED_STATUSES:
        return {"has_file": False, "file_url": None, "sumber_url": None, "judul_resmi": None}

    file_url = entry.get("file_url")
    return {
        "has_file": bool(file_url),
        "file_url": file_url,
        "sumber_url": entry.get("bpk_url"),
        "judul_resmi": entry.get("judul"),
    }
