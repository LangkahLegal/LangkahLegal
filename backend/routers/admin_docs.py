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

import logging
import uuid
from datetime import datetime
from typing import Optional

import voyageai
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, UploadFile, File, Form, status
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from schemas.admin_docs import (
    ChunkResponse,
    JobStatusResponse,
    PaginatedResponse,
    UpdateChunkRequest,
)
from services.doc_processing import (
    generate_embeddings,
    process_pdf_to_records,
)

log = logging.getLogger(__name__)
router = APIRouter()

# Kolom select (tanpa embedding — terlalu besar)
SELECT_COLS = (
    "id_dokumen, frbr_uri, node_id, node_type, kategori, "
    "nama_uu, nomor_uu, tahun_uu, status_hukum, sumber_undang_undang, "
    "pasal_bagian, judul_bab, isi_teks, created_at, updated_at"
)

# In-memory job store (untuk MVP; di production pakai Redis/DB)
_jobs: dict[str, dict] = {}


# ── Helpers ─────────────────────────────────────────────

def _require_admin(user: dict):
    if user.get("role") != "admin":
        raise HTTPException(403, "Akses ditolak. Hanya admin.")


def _embed_single(text: str) -> list[float]:
    """Embed 1 teks via Voyage AI."""
    client = voyageai.Client()
    resp = client.embed([text], model="voyage-law-2", input_type="document")
    return resp.embeddings[0]


# ── Background Task: Process & Insert PDF ──────────────

def _bg_process_pdf(job_id: str, pdf_bytes: bytes, replace_uri: str | None = None):
    """
    Background task: proses PDF dari awal sampai insert ke DB.
    Jika replace_uri diberikan, hapus dokumen lama dulu.
    """
    job = _jobs[job_id]
    job["status"] = "processing"
    job["message"] = "Memproses PDF..."

    try:
        # 1. PDF → records + metadata
        job["message"] = "Mengekstrak teks dan metadata dari PDF..."
        records, metadata = process_pdf_to_records(pdf_bytes)
        frbr_uri = metadata.get("frbr_uri", "/akn/id/act/unknown")
        job["frbr_uri"] = frbr_uri

        # 2. Embed semua teks
        job["message"] = f"Menghasilkan embedding untuk {len(records)} pasal (ini bisa memakan waktu)..."
        texts = [r["isi_teks"] for r in records]
        embeddings = generate_embeddings(texts)

        # 3. Gabungkan embedding ke records
        rows = [{**rec, "embedding": emb} for rec, emb in zip(records, embeddings)]

        # 4. DB operations
        db = get_supabase_client()

        if replace_uri:
            job["message"] = f"Menghapus dokumen lama ({replace_uri})..."
            db.table("dokumen_hukum").delete().eq("frbr_uri", replace_uri).execute()
            log.info(f"[ADMIN_DOCS] Deleted old document: {replace_uri}")

        # Cek apakah frbr_uri sudah ada (kalau bukan replace)
        if not replace_uri:
            existing = (
                db.table("dokumen_hukum")
                .select("id_dokumen", count="exact")
                .eq("frbr_uri", frbr_uri)
                .execute()
            )
            if existing.count and existing.count > 0:
                job["status"] = "failed"
                job["error"] = f"Dokumen dengan URI '{frbr_uri}' sudah ada di database. Gunakan fitur Replace jika ingin mengganti."
                job["message"] = "Gagal: dokumen sudah ada."
                return

        # Insert batch (40 rows per batch untuk hindari timeout PostgREST)
        job["message"] = f"Menyimpan {len(rows)} pasal ke database..."
        batch_size = 40
        total_inserted = 0
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            db.table("dokumen_hukum").insert(batch).execute()
            total_inserted += len(batch)

        job["status"] = "completed"
        job["total_chunks"] = total_inserted
        job["message"] = f"Berhasil! {total_inserted} pasal dari '{metadata.get('nama_uu')}' telah disimpan."
        log.info(f"[ADMIN_DOCS] Job {job_id} completed: {total_inserted} chunks inserted for {frbr_uri}")

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["message"] = f"Gagal memproses PDF: {str(e)[:200]}"
        log.error(f"[ADMIN_DOCS] Job {job_id} failed: {e}", exc_info=True)


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
    user: dict = Depends(get_current_user),
):
    """
    Upload file PDF → sistem memproses di background:
    OCR → AI Metadata Extraction → Chunking → Embedding → Insert DB.

    Response langsung 202 Accepted dengan job_id.
    Gunakan GET /jobs/{job_id} untuk cek status.
    """
    _require_admin(user)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File harus berformat PDF.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) < 100:
        raise HTTPException(400, "File PDF terlalu kecil atau kosong.")
    if len(pdf_bytes) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(400, "File PDF terlalu besar (maks 50MB).")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "message": f"File '{file.filename}' diterima. Menunggu proses...",
        "frbr_uri": None,
        "total_chunks": None,
        "error": None,
    }

    background_tasks.add_task(_bg_process_pdf, job_id, pdf_bytes)
    log.info(f"[ADMIN_DOCS] Job {job_id} queued for '{file.filename}' ({len(pdf_bytes):,} bytes)")

    return _jobs[job_id]


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
    _require_admin(user)

    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job tidak ditemukan.")
    return job


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
    _require_admin(user)

    query = db.table("dokumen_hukum_summary").select(
        "frbr_uri, nama_uu, nomor_uu, tahun_uu, kategori, status_hukum, total_chunks", count="exact"
    )

    if kategori:
        query = query.eq("kategori", kategori)
    if search:
        query = query.ilike("nama_uu", f"%{search}%")

    offset = (page - 1) * page_size
    result = query.order("frbr_uri").range(offset, offset + page_size - 1).execute()

    rows = result.data or []
    total = result.count or 0

    return PaginatedResponse(data=rows, total=total, page=page, page_size=page_size)


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
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    _require_admin(user)

    count_result = (
        db.table("dokumen_hukum")
        .select("id_dokumen", count="exact")
        .eq("frbr_uri", frbr_uri)
        .execute()
    )
    total = count_result.count or 0

    offset = (page - 1) * page_size
    result = (
        db.table("dokumen_hukum")
        .select(SELECT_COLS)
        .eq("frbr_uri", frbr_uri)
        .order("id_dokumen")
        .range(offset, offset + page_size - 1)
        .execute()
    )

    return PaginatedResponse(
        data=result.data or [], total=total, page=page, page_size=page_size
    )


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
    _require_admin(user)

    result = (
        db.table("dokumen_hukum")
        .select(SELECT_COLS)
        .eq("id_dokumen", id_dokumen)
        .execute()
    )

    if not result.data:
        raise HTTPException(404, "Chunk tidak ditemukan.")
    return result.data[0]


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
    _require_admin(user)

    existing = (
        db.table("dokumen_hukum")
        .select("id_dokumen")
        .eq("id_dokumen", id_dokumen)
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Chunk tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(400, "Tidak ada field yang diubah.")

    # Konversi enum → string
    if "kategori" in update_data and update_data["kategori"] is not None:
        update_data["kategori"] = update_data["kategori"].value

    # Re-embed jika isi_teks berubah
    if "isi_teks" in update_data:
        update_data["embedding"] = _embed_single(update_data["isi_teks"])
        log.info(f"[ADMIN_DOCS] Re-embedding chunk {id_dokumen}")

    update_data["updated_at"] = datetime.now().isoformat()

    result = (
        db.table("dokumen_hukum")
        .update(update_data)
        .eq("id_dokumen", id_dokumen)
        .execute()
    )

    if not result.data:
        raise HTTPException(500, "Gagal update chunk.")

    log.info(f"[ADMIN_DOCS] Updated chunk {id_dokumen}")
    return result.data[0]


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
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Hapus semua chunk lama (by frbr_uri), lalu proses PDF baru
    sebagai dokumen pengganti. Dijalankan di background.
    """
    _require_admin(user)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File harus berformat PDF.")

    # Validasi bahwa dokumen lama memang ada
    existing = (
        db.table("dokumen_hukum")
        .select("id_dokumen", count="exact")
        .eq("frbr_uri", frbr_uri)
        .execute()
    )
    if not (existing.count or 0):
        raise HTTPException(404, f"Dokumen dengan URI '{frbr_uri}' tidak ditemukan.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) < 100:
        raise HTTPException(400, "File PDF terlalu kecil atau kosong.")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "message": f"Akan mengganti dokumen '{frbr_uri}' dengan file baru '{file.filename}'...",
        "frbr_uri": frbr_uri,
        "total_chunks": None,
        "error": None,
    }

    background_tasks.add_task(_bg_process_pdf, job_id, pdf_bytes, replace_uri=frbr_uri)
    log.info(f"[ADMIN_DOCS] Replace job {job_id} queued for {frbr_uri}")

    return _jobs[job_id]


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
    _require_admin(user)

    existing = (
        db.table("dokumen_hukum")
        .select("id_dokumen", count="exact")
        .eq("frbr_uri", frbr_uri)
        .execute()
    )
    if not (existing.count or 0):
        raise HTTPException(404, "Dokumen dengan URI tersebut tidak ditemukan.")

    db.table("dokumen_hukum").delete().eq("frbr_uri", frbr_uri).execute()
    log.info(f"[ADMIN_DOCS] Deleted all chunks for {frbr_uri} ({existing.count} rows)")
