"""
Admin Document Management Router
=================================
CRUD endpoints untuk mengelola dokumen hukum (basis pengetahuan RAG).

Dokumen disimpan per-chunk (1 baris = 1 pasal), dikelompokkan via frbr_uri.
Setiap create/update isi_teks WAJIB generate embedding via Voyage AI.

Prefix: /api/v1/admin/documents
"""

import logging
from datetime import datetime
from typing import Optional

import voyageai
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from schemas.admin_docs import (
    BulkCreateRequest,
    ChunkResponse,
    CreateChunkRequest,
    DocumentGroupResponse,
    PaginatedResponse,
    UpdateChunkRequest,
)

log = logging.getLogger(__name__)
router = APIRouter()

EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIM = 1024

# Kolom yang diambil dari DB (sengaja exclude embedding karena terlalu besar)
SELECT_COLS = (
    "id_dokumen, frbr_uri, node_id, node_type, kategori, "
    "nama_uu, nomor_uu, tahun_uu, status_hukum, sumber_undang_undang, "
    "pasal_bagian, judul_bab, isi_teks, created_at, updated_at"
)


# ── Helpers ─────────────────────────────────────────────

def _require_admin(user: dict):
    if user.get("role") != "admin":
        raise HTTPException(403, "Akses ditolak. Hanya admin.")


def _embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed batch teks pakai Voyage AI (input_type=document)."""
    client = voyageai.Client()
    result = client.embed(texts, model=EMBEDDING_MODEL, input_type="document")
    return result.embeddings


def _embed_single(text: str) -> list[float]:
    """Embed 1 teks. Shortcut untuk _embed_texts."""
    return _embed_texts([text])[0]


# ── LIST: Daftar semua dokumen (group by frbr_uri) ──────

@router.get(
    "/",
    response_model=PaginatedResponse,
    summary="Daftar semua dokumen hukum (dikelompokkan per UU)",
)
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    kategori: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Ambil daftar dokumen dikelompokkan per frbr_uri.
    Support filter kategori dan pencarian nama UU.
    """
    _require_admin(user)

    query = db.table("dokumen_hukum").select(
        "frbr_uri, nama_uu, nomor_uu, tahun_uu, kategori, status_hukum"
    )

    if kategori:
        query = query.eq("kategori", kategori)
    if search:
        query = query.ilike("nama_uu", f"%{search}%")

    result = query.order("frbr_uri").execute()
    rows = result.data or []

    # Group by frbr_uri
    groups: dict[str, dict] = {}
    for row in rows:
        uri = row["frbr_uri"]
        if uri not in groups:
            groups[uri] = {
                "frbr_uri": uri,
                "nama_uu": row.get("nama_uu"),
                "nomor_uu": row.get("nomor_uu"),
                "tahun_uu": row.get("tahun_uu"),
                "kategori": row.get("kategori"),
                "status_hukum": row.get("status_hukum"),
                "total_chunks": 0,
            }
        groups[uri]["total_chunks"] += 1

    all_docs = list(groups.values())
    total = len(all_docs)

    # Manual pagination
    start = (page - 1) * page_size
    end = start + page_size
    paginated = all_docs[start:end]

    return PaginatedResponse(data=paginated, total=total, page=page, page_size=page_size)


# ── LIST CHUNKS: Pasal-pasal dalam 1 UU ────────────────

@router.get(
    "/chunks",
    response_model=PaginatedResponse,
    summary="Daftar chunk/pasal dalam 1 dokumen (by frbr_uri)",
)
def list_chunks(
    frbr_uri: str = Query(..., description="FRBR URI dokumen"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Ambil semua chunk/pasal dari satu dokumen berdasarkan frbr_uri."""
    _require_admin(user)

    # Count total
    count_result = (
        db.table("dokumen_hukum")
        .select("id_dokumen", count="exact")
        .eq("frbr_uri", frbr_uri)
        .execute()
    )
    total = count_result.count or 0

    # Fetch page
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


# ── GET: Detail 1 chunk ────────────────────────────────

@router.get(
    "/chunks/{id_dokumen}",
    response_model=ChunkResponse,
    summary="Detail satu chunk/pasal",
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


# ── CREATE: Tambah 1 chunk ─────────────────────────────

@router.post(
    "/chunks",
    response_model=ChunkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tambah 1 chunk/pasal baru (auto-embed)",
)
def create_chunk(
    payload: CreateChunkRequest,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Tambah 1 chunk/pasal baru ke database.
    isi_teks akan di-embed otomatis via Voyage AI sebelum disimpan.
    """
    _require_admin(user)

    # Embed dulu
    embedding = _embed_single(payload.isi_teks)

    row = payload.model_dump()
    row["kategori"] = row["kategori"].value  # enum → string
    row["embedding"] = embedding

    result = db.table("dokumen_hukum").insert(row).execute()

    if not result.data:
        raise HTTPException(500, "Gagal menyimpan chunk.")

    log.info(f"[DOCS] Created chunk {result.data[0]['id_dokumen']} ({payload.pasal_bagian})")
    return result.data[0]


# ── BULK CREATE: Insert banyak chunk sekaligus ─────────

@router.post(
    "/chunks/bulk",
    status_code=status.HTTP_201_CREATED,
    summary="Tambah banyak chunk sekaligus (auto-embed batch)",
)
def create_chunks_bulk(
    payload: BulkCreateRequest,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Insert banyak chunk dalam satu request. Embedding di-batch
    via Voyage AI untuk efisiensi. Cocok untuk upload 1 UU penuh.
    """
    _require_admin(user)

    texts = [c.isi_teks for c in payload.chunks]

    # Batch embed (Voyage AI supports up to 128 texts per call)
    all_embeddings = []
    batch_size = 128
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        embeddings = _embed_texts(batch)
        all_embeddings.extend(embeddings)

    # Build rows
    rows = []
    for chunk, emb in zip(payload.chunks, all_embeddings):
        row = chunk.model_dump()
        row["kategori"] = row["kategori"].value
        row["embedding"] = emb
        rows.append(row)

    result = db.table("dokumen_hukum").insert(rows).execute()

    inserted = result.data or []
    log.info(f"[DOCS] Bulk created {len(inserted)} chunks")

    return {
        "message": f"Berhasil menyimpan {len(inserted)} chunk.",
        "total_inserted": len(inserted),
        "ids": [r["id_dokumen"] for r in inserted],
    }


# ── UPDATE: Edit 1 chunk ──────────────────────────────

@router.patch(
    "/chunks/{id_dokumen}",
    response_model=ChunkResponse,
    summary="Update chunk/pasal (auto re-embed jika isi_teks berubah)",
)
def update_chunk(
    id_dokumen: int,
    payload: UpdateChunkRequest,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Update field-field dari chunk. Jika isi_teks berubah, embedding
    akan di-generate ulang secara otomatis.
    """
    _require_admin(user)

    # Cek chunk ada
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

    # Konversi enum
    if "kategori" in update_data and update_data["kategori"] is not None:
        update_data["kategori"] = update_data["kategori"].value

    # Re-embed jika isi_teks berubah
    if "isi_teks" in update_data:
        update_data["embedding"] = _embed_single(update_data["isi_teks"])
        log.info(f"[DOCS] Re-embedding chunk {id_dokumen}")

    update_data["updated_at"] = datetime.now().isoformat()

    result = (
        db.table("dokumen_hukum")
        .update(update_data)
        .eq("id_dokumen", id_dokumen)
        .execute()
    )

    if not result.data:
        raise HTTPException(500, "Gagal update chunk.")

    log.info(f"[DOCS] Updated chunk {id_dokumen}")
    return result.data[0]


# ── DELETE: Hapus 1 chunk ──────────────────────────────

@router.delete(
    "/chunks/{id_dokumen}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Hapus 1 chunk/pasal",
)
def delete_chunk(
    id_dokumen: int,
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

    db.table("dokumen_hukum").delete().eq("id_dokumen", id_dokumen).execute()
    log.info(f"[DOCS] Deleted chunk {id_dokumen}")


# ── DELETE: Hapus 1 UU penuh (semua chunk) ─────────────

@router.delete(
    "/by-uri",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Hapus seluruh chunk dari 1 dokumen (by frbr_uri)",
)
def delete_document_by_uri(
    frbr_uri: str = Query(..., description="FRBR URI dokumen yang akan dihapus"),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Hapus semua chunk yang memiliki frbr_uri yang sama (= hapus 1 UU penuh)."""
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
    log.info(f"[DOCS] Deleted all chunks for frbr_uri={frbr_uri} ({existing.count} rows)")
