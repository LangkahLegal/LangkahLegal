"""
Admin Document Management Router
=================================
CRUD endpoints untuk mengelola dokumen hukum (basis pengetahuan RAG).

Flow utama:
  - CREATE: Upload PDF → Background Task (OCR → AI Metadata → Chunk → Embed → Insert)
  - READ:   List dokumen (grouped) & list chunks per dokumen
  - UPDATE: Patch 1 chunk (re-embed jika teks berubah) ATAU replace full via PDF
  - DELETE: Hapus 1 dokumen penuh (semua chunk by frbr_uri)

Prefix: /api/v1/admin/documents
"""

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, UploadFile, File, Form, status
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from schemas.admin_docs import (
    ChunkResponse,
    JobStatusResponse,
    PaginatedResponse,
    UpdateChunkRequest,
)
from services import admin_doc_service

router = APIRouter()


@router.post(
    "/upload",
    response_model=JobStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload PDF dokumen hukum baru (async background)",
    description="""
API ini menerima upload file PDF dokumen hukum secara utuh. File PDF akan diproses di background task agar tidak memblokir respon HTTP, mengingat pemrosesan dokumen memakan waktu yang cukup lama.

**Proses Background (Service doc_processing):**
1. **OCR & Text Extraction**: Menggunakan PyMuPDF untuk mengambil seluruh teks dari PDF, dikurangi noise seperti watermark atau text-header.
2. **Metadata Extraction (AI)**: Memanfaatkan Google Gemini AI untuk mengidentifikasi judul UU, nomor, tahun, kategori hukum, status hukum, dan menghasilkan identifier unik `frbr_uri`.
3. **Chunking**: Memecah dokumen panjang menjadi potongan-potongan kecil berdasarkan pasal.
4. **Vector Embedding**: Mengonversi setiap potongan teks ke dalam representasi vektor 1024-dimensi menggunakan Voyage AI (model `voyage-law-2`), lengkap dengan mekanisme antrean batch rate-limit untuk menghindari error 429.
5. **Database Upsert**: Menyimpan potongan-potongan tersebut secara massal (bulk insert) ke dalam database Supabase.

Endpoint ini langsung mereturn HTTP 202 Accepted beserta `job_id` yang bisa dipolling di endpoint `/jobs/{job_id}` untuk melihat status terkini.
    """
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="File PDF dokumen hukum"),
    nama_uu: str = Form(..., description="Nama lengkap undang-undang"),
    nomor_uu: str | None = Form(None, description="Nomor undang-undang"),
    tahun_uu: int | None = Form(None, description="Tahun undang-undang"),
    kategori: str = Form(..., description="Kategori hukum"),
    status_hukum: str = Form(..., description="Status hukum"),
    user: dict = Depends(get_current_user),
):
    """
    Upload file PDF beserta metadata secara manual → sistem memproses di background:
    Teks Ekstraksi → Chunking → Embedding → Insert DB.

    Proses AI Extraction di-bypass jika metadata manual disediakan.
    Response langsung 202 Accepted dengan job_id.
    """
    job, pdf_bytes, manual_metadata = await admin_doc_service.create_upload_job(
        user=user,
        file=file,
        nama_uu=nama_uu,
        nomor_uu=nomor_uu,
        tahun_uu=tahun_uu,
        kategori=kategori,
        status_hukum=status_hukum,
    )

    background_tasks.add_task(
        admin_doc_service.process_pdf_job, job["job_id"], pdf_bytes, manual_metadata
    )

    return job


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Cek status background job (upload/replace)",
    description="""
API ini digunakan untuk memantau status pemrosesan PDF yang berjalan di background. 
Frontend harus memanggil endpoint ini secara berkala (polling) menggunakan `job_id` yang didapatkan dari endpoint `/upload` atau `/replace`.

**Status yang mungkin dikembalikan:**
- `queued`: Menunggu dalam antrean untuk diproses.
- `processing`: Sedang dalam tahap OCR, chunking, atau embedding.
- `completed`: Pemrosesan berhasil sepenuhnya dan data sudah masuk ke database.
- `failed`: Terjadi kesalahan saat memproses (misalnya gagal OCR atau API limit terlampaui). Detail error akan diberikan pada field message.
    """
)
def get_job_status(
    job_id: str,
    user: dict = Depends(get_current_user),
):
    return admin_doc_service.get_job_status(user, job_id)


@router.get(
    "/",
    response_model=PaginatedResponse,
    summary="List semua dokumen hukum (grouped per UU)",
    description="""
API ini menampilkan daftar seluruh dokumen hukum yang ada di database.
Karena di database setiap baris merepresentasikan 1 pasal (chunk), endpoint ini akan mengelompokkan baris-baris tersebut berdasarkan `frbr_uri` sehingga mengembalikan daftar **dokumen utuh** beserta total pasalnya.

Admin dapat memfilter berdasarkan `kategori` hukum dan mencari berdasarkan `nama_uu`. Data dikembalikan dalam format paginasi.
    """
)
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    kategori: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_doc_service.list_documents(db, user, page, page_size, kategori, search)


@router.get(
    "/chunks",
    response_model=PaginatedResponse,
    summary="List pasal/chunks dari 1 dokumen (by frbr_uri)",
    description="""
API ini mengambil semua pasal/potongan teks (chunks) dari satu dokumen hukum spesifik yang dicari menggunakan `frbr_uri`.

Biasanya digunakan oleh admin saat mereka mengklik satu dokumen dari daftar dokumen, lalu ingin melihat atau mengaudit rincian teks per pasalnya. Endpoint mendukung paginasi agar performa tetap cepat meskipun suatu UU memiliki ratusan pasal.
    """
)
def list_chunks(
    frbr_uri: str = Query(..., description="FRBR URI dokumen"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Pencarian isi teks atau nomor pasal"),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_doc_service.list_chunks(db, user, frbr_uri, page, page_size, search)


@router.get(
    "/chunks/{id_dokumen}",
    response_model=ChunkResponse,
    summary="Detail satu chunk/pasal",
    description="""
API ini mengembalikan detail spesifik dari **satu baris data (satu pasal)** berdasarkan Primary Key `id_dokumen`.
Digunakan untuk pre-fill form di sisi frontend jika admin ingin mengedit isi teks atau kategori dari pasal tertentu.
    """
)
def get_chunk(
    id_dokumen: int,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_doc_service.get_chunk(db, user, id_dokumen)


@router.patch(
    "/chunks/{id_dokumen}",
    response_model=ChunkResponse,
    summary="Update 1 chunk/pasal (auto re-embed jika teks berubah)",
    description="""
API ini digunakan oleh admin untuk memperbaiki kesalahan secara manual pada 1 pasal spesifik (misal: membenarkan typo dari hasil OCR atau mengubah kategori).

**Fitur Cerdas (Auto Re-Embed):**
Jika field `isi_teks` diubah, endpoint ini akan otomatis memanggil API Voyage AI secara synchronous untuk membuat ulang vector embedding teks tersebut. Hal ini memastikan bahwa perubahan teks tidak membuat pencarian pencarian vektor RAG menjadi usang atau tidak akurat.
    """
)
def update_chunk(
    id_dokumen: int,
    payload: UpdateChunkRequest,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_doc_service.update_chunk(db, user, id_dokumen, payload)


@router.put(
    "/replace",
    response_model=JobStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Replace 1 dokumen penuh dengan PDF baru (async)",
    description="""
API ini memungkinkan admin menimpa/mengganti (replace) keseluruhan dokumen yang sudah ada dengan PDF versi terbaru (misalnya karena PDF sebelumnya buram atau memiliki revisi minor).

**Alur Kerja:**
1. Endpoint menerima `frbr_uri` dari dokumen lama beserta file PDF baru.
2. Endpoint memberikan respons 202 Accepted seketika dan membuat `job_id`.
3. Di background, Service akan melakukan penghapusan paksa (cascade-like) pada seluruh chunk/pasal dokumen lama berdasarkan URI tersebut.
4. Setelah bersih, service mengekstrak, meng-chunk, men-generate embedding, dan menyimpan pasal-pasal dari PDF baru.
    """
)
async def replace_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="File PDF pengganti"),
    frbr_uri: str = Form(..., description="FRBR URI dokumen yang akan di-replace"),
    nama_uu: str = Form(..., description="Nama lengkap undang-undang"),
    nomor_uu: str | None = Form(None, description="Nomor undang-undang"),
    tahun_uu: int | None = Form(None, description="Tahun undang-undang"),
    kategori: str = Form(..., description="Kategori hukum"),
    status_hukum: str = Form(..., description="Status hukum"),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Hapus semua chunk lama (by frbr_uri), lalu proses PDF baru
    sebagai dokumen pengganti. Dijalankan di background.
    """
    job, pdf_bytes, manual_metadata = await admin_doc_service.create_replace_job(
        db=db,
        user=user,
        file=file,
        frbr_uri=frbr_uri,
        nama_uu=nama_uu,
        nomor_uu=nomor_uu,
        tahun_uu=tahun_uu,
        kategori=kategori,
        status_hukum=status_hukum,
    )

    background_tasks.add_task(
        admin_doc_service.process_pdf_job,
        job["job_id"],
        pdf_bytes,
        manual_metadata=manual_metadata,
        replace_uri=frbr_uri,
    )

    return job


@router.delete(
    "/by-uri",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Hapus seluruh chunk dari 1 dokumen (by frbr_uri)",
    description="""
API ini melayani penghapusan penuh dari satu dokumen hukum.
Penting: Sistem ini melarang penghapusan satu baris chunk saja untuk menjaga keutuhan dokumen pada sistem RAG. Sebagai gantinya, admin harus menghapus dokumen secara keseluruhan dengan mem-passing `frbr_uri`-nya. Endpoint ini akan mencari semua baris pasal dengan URI tersebut dan menghapusnya dari database sekaligus.
    """
)
def delete_document(
    frbr_uri: str = Query(..., description="FRBR URI dokumen yang akan dihapus"),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    admin_doc_service.delete_document(db, user, frbr_uri)
