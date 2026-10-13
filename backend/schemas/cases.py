from dataclasses import dataclass
from typing import Optional

from fastapi import File, Form, UploadFile


@dataclass
class CaseForm:
    kategori_hukum: str = Form(...)
    deskripsi_kasus_awam: str = Form(...)
    tanggal_konsultasi: str = Form(...)
    jam_mulai: str = Form(...)
    jam_selesai: str = Form(...)
    dokumen_bukti: Optional[str] = Form(default=None)
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None)
