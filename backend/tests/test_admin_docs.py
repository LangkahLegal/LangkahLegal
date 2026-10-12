import pytest

from services import admin_doc_service

FRBR_URI = "/akn/id/act/uu-1-2020"


class FakeDocumentRepository:
    def __init__(self, existing_count=0):
        self.existing_count = existing_count
        self.deleted = []
        self.batches = []

    def count_by_uri(self, db, frbr_uri, search=None):
        return self.existing_count

    def delete_by_uri(self, db, frbr_uri):
        self.deleted.append(frbr_uri)

    def insert_many(self, db, rows):
        self.batches.append(rows)


@pytest.fixture
def run_job(monkeypatch):
    def _run(existing_count=0, total_records=3, error=None, replace_uri=None):
        repo = FakeDocumentRepository(existing_count)
        records = [{"isi_teks": f"pasal {i}"} for i in range(total_records)]

        def fake_process(pdf_bytes, manual_metadata=None):
            if error:
                raise error
            return records, {"frbr_uri": FRBR_URI, "nama_uu": "UU Contoh"}

        monkeypatch.setattr(admin_doc_service, "process_pdf_to_records", fake_process)
        monkeypatch.setattr(
            admin_doc_service, "generate_embeddings", lambda texts: [[0.1]] * len(texts)
        )
        monkeypatch.setattr(admin_doc_service, "get_supabase_client", lambda: object())
        monkeypatch.setattr(admin_doc_service, "legal_document_repository", repo)

        job_id = "job-1"
        admin_doc_service._jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "message": "",
            "frbr_uri": None,
            "total_chunks": None,
            "error": None,
        }

        admin_doc_service.process_pdf_job(job_id, b"%PDF", {"nama_uu": "UU Contoh"}, replace_uri)
        return admin_doc_service._jobs[job_id], repo

    yield _run
    admin_doc_service._jobs.clear()


def test_process_pdf_job_completed(run_job):
    job, repo = run_job(total_records=3)

    assert job["status"] == "completed"
    assert job["total_chunks"] == 3
    assert job["frbr_uri"] == FRBR_URI
    assert job["error"] is None
    assert "UU Contoh" in job["message"]
    assert repo.deleted == []
    assert repo.batches[0][0] == {"isi_teks": "pasal 0", "embedding": [0.1]}


def test_process_pdf_job_inserts_in_batches_of_40(run_job):
    job, repo = run_job(total_records=85)

    assert job["total_chunks"] == 85
    assert [len(batch) for batch in repo.batches] == [40, 40, 5]


def test_process_pdf_job_rejects_existing_document(run_job):
    job, repo = run_job(existing_count=4)

    assert job["status"] == "failed"
    assert job["message"] == "Gagal: dokumen sudah ada."
    assert FRBR_URI in job["error"]
    assert repo.batches == []


def test_process_pdf_job_replace_deletes_old_document(run_job):
    job, repo = run_job(existing_count=4, replace_uri="/akn/id/act/uu-lama")

    assert job["status"] == "completed"
    assert repo.deleted == ["/akn/id/act/uu-lama"]
    assert len(repo.batches) == 1


def test_process_pdf_job_failure_is_recorded(run_job):
    job, repo = run_job(error=RuntimeError("OCR gagal"))

    assert job["status"] == "failed"
    assert job["error"] == "OCR gagal"
    assert job["message"] == "Gagal memproses PDF: OCR gagal"
    assert repo.batches == []


ADMIN = {"id_user": 1, "role": "admin"}
FORM_FIELDS = {"nama_uu": "UU Contoh", "kategori": "umum", "status_hukum": "berlaku"}
PDF_FILE = {"file": ("uu.pdf", b"%PDF-1.4 " + b"x" * 200, "application/pdf")}


def test_upload_document_queues_job(app_client, monkeypatch):
    queued = []
    monkeypatch.setattr(
        admin_doc_service, "process_pdf_job", lambda *args, **kwargs: queued.append((args, kwargs))
    )
    client, _ = app_client(current_user=ADMIN)

    response = client.post(
        "/api/v1/admin/documents/upload",
        data={**FORM_FIELDS, "nomor_uu": "13", "tahun_uu": "2003"},
        files=PDF_FILE,
    )

    assert response.status_code == 202
    assert response.json()["status"] == "queued"
    args, _ = queued[0]
    assert args[2]["frbr_uri"] == "/akn/id/act/uu-13-2003"
    assert args[2]["nomor_uu"] == "UU No. 13 Tahun 2003"
    admin_doc_service._jobs.clear()


def test_upload_document_rejects_non_pdf(app_client):
    client, _ = app_client(current_user=ADMIN)

    response = client.post(
        "/api/v1/admin/documents/upload",
        data=FORM_FIELDS,
        files={"file": ("uu.txt", b"bukan pdf", "text/plain")},
    )

    assert response.status_code == 400


def test_replace_document_not_found(app_client):
    client, _ = app_client(
        table_responses={"dokumen_hukum": [([], 0)]},
        current_user=ADMIN,
    )

    response = client.put(
        "/api/v1/admin/documents/replace",
        data={**FORM_FIELDS, "frbr_uri": "/akn/id/act/uu-1-2020"},
        files=PDF_FILE,
    )

    assert response.status_code == 404


def test_replace_document_queues_job(app_client, monkeypatch):
    queued = []
    monkeypatch.setattr(
        admin_doc_service, "process_pdf_job", lambda *args, **kwargs: queued.append((args, kwargs))
    )
    client, _ = app_client(
        table_responses={"dokumen_hukum": [([{"id_dokumen": 1}], 1)]},
        current_user=ADMIN,
    )

    response = client.put(
        "/api/v1/admin/documents/replace",
        data={**FORM_FIELDS, "frbr_uri": "/akn/id/act/uu-1-2020"},
        files=PDF_FILE,
    )

    assert response.status_code == 202
    _, kwargs = queued[0]
    assert kwargs["replace_uri"] == "/akn/id/act/uu-1-2020"
    assert kwargs["manual_metadata"]["frbr_uri"] == "/akn/id/act/uu-1-2020"
    admin_doc_service._jobs.clear()
