from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from supabase import Client

from core.database import get_supabase_client
from core.dependencies import get_current_user
from core.user import CurrentUser
from docs import admin_docs as docs
from schemas.admin_docs import (
    ChunkResponse,
    DocumentReplaceForm,
    DocumentUploadForm,
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
    **docs.UPLOAD_DOCUMENT,
)
async def upload_document(
    background_tasks: BackgroundTasks,
    form: DocumentUploadForm = Depends(),
    user: CurrentUser = Depends(get_current_user),
):
    job, pdf_bytes, manual_metadata = await admin_doc_service.create_upload_job(user, form)

    background_tasks.add_task(admin_doc_service.process_pdf_job, job["job_id"], pdf_bytes, manual_metadata)

    return job


@router.get("/jobs/{job_id}", response_model=JobStatusResponse, **docs.GET_JOB_STATUS)
def get_job_status(
    job_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    return admin_doc_service.get_job_status(user, job_id)


@router.get("/", response_model=PaginatedResponse, **docs.LIST_DOCUMENTS)
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    kategori: Optional[str] = None,
    search: Optional[str] = None,
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_doc_service.list_documents(db, user, page, page_size, kategori, search)


@router.get("/chunks", response_model=PaginatedResponse, **docs.LIST_CHUNKS)
def list_chunks(
    frbr_uri: str = Query(..., description="FRBR URI dokumen"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Pencarian isi teks atau nomor pasal"),
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_doc_service.list_chunks(db, user, frbr_uri, page, page_size, search)


@router.get("/chunks/{id_dokumen}", response_model=ChunkResponse, **docs.GET_CHUNK)
def get_chunk(
    id_dokumen: int,
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_doc_service.get_chunk(db, user, id_dokumen)


@router.patch("/chunks/{id_dokumen}", response_model=ChunkResponse, **docs.UPDATE_CHUNK)
def update_chunk(
    id_dokumen: int,
    payload: UpdateChunkRequest,
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_doc_service.update_chunk(db, user, id_dokumen, payload)


@router.put(
    "/replace",
    response_model=JobStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
    **docs.REPLACE_DOCUMENT,
)
async def replace_document(
    background_tasks: BackgroundTasks,
    form: DocumentReplaceForm = Depends(),
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    job, pdf_bytes, manual_metadata = await admin_doc_service.create_replace_job(db, user, form)

    background_tasks.add_task(
        admin_doc_service.process_pdf_job,
        job["job_id"],
        pdf_bytes,
        manual_metadata=manual_metadata,
        replace_uri=form.frbr_uri,
    )

    return job


@router.delete("/by-uri", status_code=status.HTTP_204_NO_CONTENT, **docs.DELETE_DOCUMENT)
def delete_document(
    frbr_uri: str = Query(..., description="FRBR URI dokumen yang akan dihapus"),
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    admin_doc_service.delete_document(db, user, frbr_uri)
