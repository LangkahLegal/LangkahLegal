from services.rag_service import (
    _attach_document_status,
    _build_references,
    _build_source_documents,
    retrieve_pasals,
)


class _FakeSummaryTable:
    def __init__(self, data=None, error=None):
        self._data = data
        self._error = error
        self.calls = []

    def table(self, name):
        self.calls.append(("table", name))
        return self

    def select(self, cols):
        return self

    def in_(self, column, values):
        self.calls.append(("in_", column, list(values)))
        return self

    def execute(self):
        if self._error:
            raise self._error
        return type("Resp", (), {"data": self._data})()


def _source(frbr_uri):
    return {"frbr_uri": frbr_uri, "status_hukum": None, "has_file": False, "pasal": []}


def test_attach_document_status_fills_from_summary_view():
    db = _FakeSummaryTable(
        data=[
            {"frbr_uri": "/akn/id/act/uu-13-2003", "status_hukum": "berlaku"},
        ]
    )
    sources = [_source("/akn/id/act/uu-13-2003"), _source("/akn/id/act/uu-6-2023")]

    result = _attach_document_status(db, sources)

    assert db.calls[0] == ("table", "dokumen_hukum_summary")
    assert db.calls[1] == ("in_", "frbr_uri", ["/akn/id/act/uu-13-2003", "/akn/id/act/uu-6-2023"])
    assert result[0]["status_hukum"] == "berlaku"
    assert result[1]["status_hukum"] is None


def test_attach_document_status_failure_keeps_sources():
    db = _FakeSummaryTable(error=RuntimeError("view missing"))
    sources = [_source("/akn/id/act/uu-13-2003")]

    result = _attach_document_status(db, sources)

    assert result == [_source("/akn/id/act/uu-13-2003")]


def test_attach_document_status_skips_query_when_no_sources():
    db = _FakeSummaryTable(data=[])

    assert _attach_document_status(db, []) == []
    assert db.calls == []


class _FakeRpc:
    def __init__(self, data):
        self._data = data
        self.calls = []

    def rpc(self, name, params):
        self.calls.append((name, params))
        return self

    def execute(self):
        return type("Resp", (), {"data": self._data})()


def test_retrieve_pasals_maps_rpc_id_to_id_dokumen():
    rpc = _FakeRpc(
        [
            {"id": 812, "frbr_uri": "/akn/id/act/uu-13-2003", "pasal_bagian": "Pasal 156", "similarity": 0.73},
        ]
    )

    rows = retrieve_pasals(rpc, [0.0] * 1024, filter_kategori="ketenagakerjaan")

    assert rows[0]["id_dokumen"] == 812
    assert rpc.calls[0][0] == "match_dokumen_hukum"
    assert rpc.calls[0][1]["filter_kategori"] == "ketenagakerjaan"
    assert _build_source_documents(rows)[0]["pasal"][0]["id_dokumen"] == 812


def test_retrieve_pasals_empty_result():
    assert retrieve_pasals(_FakeRpc(None), [0.0] * 1024) == []


def _pasal(id_dokumen, frbr_uri, pasal_bagian, similarity, **extra):
    return {
        "id_dokumen": id_dokumen,
        "frbr_uri": frbr_uri,
        "nama_uu": extra.get("nama_uu", "UU Ketenagakerjaan"),
        "nomor_uu": extra.get("nomor_uu", "UU No. 13 Tahun 2003"),
        "tahun_uu": extra.get("tahun_uu", 2003),
        "kategori": extra.get("kategori", "ketenagakerjaan"),
        "status_hukum": "berlaku",
        "pasal_bagian": pasal_bagian,
        "judul_bab": None,
        "isi_teks": "...",
        "similarity": similarity,
    }


UU_13 = "/akn/id/act/uu-13-2003"
UU_6 = "/akn/id/act/uu-6-2023"


def test_build_references_includes_identifiers():
    refs = _build_references([_pasal(812, UU_13, "Pasal 156", 0.73123)])

    assert refs[0]["id_dokumen"] == 812
    assert refs[0]["frbr_uri"] == UU_13
    assert refs[0]["similarity"] == 0.7312


def test_build_references_tolerates_rpc_without_identifiers():
    refs = _build_references([{"nama_uu": "UU X", "pasal_bagian": "Pasal 1", "similarity": 0.7}])

    assert refs[0]["id_dokumen"] is None
    assert refs[0]["frbr_uri"] is None


def test_source_documents_grouped_and_ordered_by_best_similarity():
    pasals = [
        _pasal(1, UU_6, "Pasal 81", 0.65, nomor_uu="UU No. 6 Tahun 2023"),
        _pasal(2, UU_13, "Pasal 161", 0.70),
        _pasal(3, UU_13, "Pasal 156", 0.80),
    ]

    docs = _build_source_documents(pasals)

    assert [d["frbr_uri"] for d in docs] == [UU_13, UU_6]
    assert [p["pasal_bagian"] for p in docs[0]["pasal"]] == ["Pasal 156", "Pasal 161"]
    assert docs[0]["has_file"] is False
    assert docs[1]["nomor_uu"] == "UU No. 6 Tahun 2023"


def test_source_documents_filters_low_similarity():
    pasals = [_pasal(1, UU_13, "Pasal 1", 0.55), _pasal(2, UU_13, "Pasal 2", 0.61)]

    docs = _build_source_documents(pasals)

    assert len(docs) == 1
    assert [p["id_dokumen"] for p in docs[0]["pasal"]] == [2]


def test_source_documents_empty_when_nothing_passes_threshold():
    assert _build_source_documents([_pasal(1, UU_13, "Pasal 1", 0.51)]) == []
    assert _build_source_documents([]) == []


def test_source_documents_capped_at_max_documents():
    pasals = [_pasal(i, f"/akn/id/act/uu-{i}-2020", "Pasal 1", 0.9 - i * 0.01) for i in range(5)]

    docs = _build_source_documents(pasals, max_documents=3)

    assert [d["frbr_uri"] for d in docs] == [
        "/akn/id/act/uu-0-2020",
        "/akn/id/act/uu-1-2020",
        "/akn/id/act/uu-2-2020",
    ]


def test_source_documents_skip_rows_without_identifiers():
    pasals = [
        {"nama_uu": "UU X", "pasal_bagian": "Pasal 1", "similarity": 0.9},
        _pasal(None, UU_13, "Pasal 2", 0.9),
        _pasal(3, UU_13, "Pasal 3", 0.7),
    ]

    docs = _build_source_documents(pasals)

    assert len(docs) == 1
    assert [p["id_dokumen"] for p in docs[0]["pasal"]] == [3]


class _FakeSupabase:
    def __init__(self, rpc_rows, summary_rows):
        self._rpc = _FakeRpc(rpc_rows)
        self._summary = _FakeSummaryTable(data=summary_rows)

    def rpc(self, name, params):
        return self._rpc.rpc(name, params)

    def table(self, name):
        return self._summary.table(name)


def test_triage_returns_grouped_sources_with_status(monkeypatch):
    from services import rag_service

    rpc_rows = [
        {
            "id": 812,
            "frbr_uri": "/akn/id/act/uu-13-2003",
            "nama_uu": "UU Ketenagakerjaan",
            "nomor_uu": "UU No. 13 Tahun 2003",
            "tahun_uu": 2003,
            "pasal_bagian": "Pasal 156",
            "judul_bab": None,
            "isi_teks": "...",
            "kategori": "ketenagakerjaan",
            "similarity": 0.81,
        },
        {
            "id": 900,
            "frbr_uri": "/akn/id/act/uu-13-2003",
            "nama_uu": "UU Ketenagakerjaan",
            "nomor_uu": "UU No. 13 Tahun 2003",
            "tahun_uu": 2003,
            "pasal_bagian": "Pasal 161",
            "judul_bab": None,
            "isi_teks": "...",
            "kategori": "ketenagakerjaan",
            "similarity": 0.52,
        },
    ]
    db = _FakeSupabase(rpc_rows, [{"frbr_uri": "/akn/id/act/uu-13-2003", "status_hukum": "berlaku"}])

    monkeypatch.setattr(rag_service, "embed_query", lambda q: [0.0] * 1024)
    monkeypatch.setattr(rag_service, "agentic_generate", lambda **kwargs: {"type": "text", "jawaban": "Jawaban"})

    result = rag_service.triage("saya di-PHK tanpa pesangon sama sekali", db)

    assert [r["id_dokumen"] for r in result["pasal_referensi"]] == [812, 900]
    assert len(result["sumber_dokumen"]) == 1
    doc = result["sumber_dokumen"][0]
    assert doc["status_hukum"] == "berlaku"
    assert [p["id_dokumen"] for p in doc["pasal"]] == [812]
