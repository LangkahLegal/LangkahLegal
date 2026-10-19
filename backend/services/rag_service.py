import logging
import time
from typing import Optional

import voyageai
from google import genai
from google.genai import types
from supabase import Client

from core.config import get_settings
from helpers.embedding import get_voyage_client
from helpers.peraturan_files import get_file_info
from repositories import consultant_repository, legal_document_repository
from services import chat_policy
from services.chat_policy import Gaya, Mode, ToolMode

logger = logging.getLogger(__name__)


EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIM = 1024
LLM_MODEL = "gemini-2.5-flash"


MAX_HISTORY_CHARS = 60_000
TEMPERATURE = 0.3

SOURCE_MIN_SIMILARITY = 0.6
SOURCE_MAX_DOCUMENTS = 3

DISCLAIMER = "⚠️ Jawaban ini bukan nasihat hukum resmi. Konsultasikan dengan advokat untuk kepastian hukum."


TOOL_NAME = "siapkan_konsultasi"
KATEGORI_KONSULTAN = ["Pidana", "Perdata", "Ketenagakerjaan", "Teknologi Informasi", "HAM", "Umum"]

KONSULTASI_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name=TOOL_NAME,
            description=(
                "Siapkan pengajuan konsultasi untuk klien: mencari advokat/konsultan yang sesuai dan "
                "merangkum kasus klien supaya klien tidak perlu menulis ulang ceritanya."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "kategori": {
                        "type": "string",
                        "description": "Spesialisasi hukum yang paling sesuai dengan kasus klien.",
                        "enum": KATEGORI_KONSULTAN,
                    },
                    "kota": {
                        "type": "string",
                        "description": "Kota yang diminta klien. Jangan diisi kalau klien tidak menyebut kota.",
                    },
                    "max_budget": {
                        "type": "integer",
                        "description": "Budget maksimal per sesi (Rupiah). Jangan diisi kalau klien tidak menyebut budget.",
                    },
                    "ringkasan_kasus": {
                        "type": "string",
                        "description": (
                            "Ringkasan kasus dalam 2-4 kalimat, ditulis sebagai orang pertama dari sudut "
                            'pandang klien ("Saya ..."), dengan bahasa baku. HANYA fakta dari percakapan, '
                            "tanpa kesimpulan hukum dan tanpa saran. Kosongkan kalau klien belum "
                            "menceritakan kasusnya."
                        ),
                    },
                    "bukti_dimiliki": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Bukti yang klien sebut sudah dimiliki.",
                    },
                    "bukti_perlu_disiapkan": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Dokumen atau bukti yang sebaiknya disiapkan klien untuk konsultasi.",
                    },
                },
                "required": ["kategori"],
            },
        )
    ]
)


AGENT_MODELS = ("gemini-2.5-flash", "gemini-2.5-flash-lite")
AGENT_MAX_RETRIES = 2
# NOT_FOUND: model sudah dipensiunkan Google, lanjut ke model berikutnya alih-alih gagal total.
MODEL_UNAVAILABLE_MARKERS = ("429", "503", "UNAVAILABLE", "NOT_FOUND")


def _get_voyage_client() -> voyageai.Client:
    return get_voyage_client()


def _get_gemini_client() -> genai.Client:
    settings = get_settings()
    return genai.Client(api_key=settings.google_api_key)


def embed_query(query: str) -> list[float]:
    client = _get_voyage_client()
    result = client.embed([query], model=EMBEDDING_MODEL, input_type="query")
    return result.embeddings[0]


def retrieve_pasals(
    supabase: Client,
    query_embedding: list[float],
    match_count: int = 5,
    match_threshold: float = 0.5,
    filter_kategori: Optional[str] = None,
) -> list[dict]:
    params = {
        "query_embedding": query_embedding,
        "match_threshold": match_threshold,
        "match_count": match_count,
    }
    if filter_kategori:
        params["filter_kategori"] = filter_kategori

    rows = legal_document_repository.match_by_embedding(supabase, params)
    for row in rows:
        if "id_dokumen" not in row:
            row["id_dokumen"] = row.get("id")
    return rows


def _build_context(pasals: list[dict]) -> str:
    if not pasals:
        return ""

    parts = []
    for i, p in enumerate(pasals, 1):
        sim = round(p.get("similarity", 0) * 100, 1)
        header = f"[Sumber {i}] {p.get('nama_uu', '')} — {p.get('pasal_bagian', '')}"
        if p.get("judul_bab"):
            header += f" ({p['judul_bab']})"
        header += f" [Relevansi: {sim}%]"
        parts.append(f"{header}\n{p.get('isi_teks', '')}")

    return "\n\n---\n\n".join(parts)


def _build_references(pasals: list[dict]) -> list[dict]:
    return [
        {
            "id_dokumen": p.get("id_dokumen"),
            "frbr_uri": p.get("frbr_uri"),
            "nama_uu": p.get("nama_uu", ""),
            "nomor_uu": p.get("nomor_uu", ""),
            "pasal_bagian": p.get("pasal_bagian", ""),
            "judul_bab": p.get("judul_bab", ""),
            "similarity": round(p.get("similarity", 0), 4),
        }
        for p in pasals
    ]


def _build_source_documents(
    pasals: list[dict],
    min_similarity: float = SOURCE_MIN_SIMILARITY,
    max_documents: int = SOURCE_MAX_DOCUMENTS,
) -> list[dict]:
    groups: dict[str, dict] = {}
    for p in pasals:
        frbr_uri = p.get("frbr_uri")
        id_dokumen = p.get("id_dokumen")
        similarity = round(p.get("similarity", 0), 4)
        if not frbr_uri or id_dokumen is None or similarity < min_similarity:
            continue

        doc = groups.setdefault(
            frbr_uri,
            {
                "frbr_uri": frbr_uri,
                "nama_uu": p.get("nama_uu"),
                "nomor_uu": p.get("nomor_uu"),
                "tahun_uu": p.get("tahun_uu"),
                "kategori": p.get("kategori"),
                "status_hukum": p.get("status_hukum"),
                **get_file_info(frbr_uri),
                "pasal": [],
            },
        )
        doc["pasal"].append(
            {
                "id_dokumen": id_dokumen,
                "pasal_bagian": p.get("pasal_bagian", ""),
                "similarity": similarity,
            }
        )

    for doc in groups.values():
        doc["pasal"].sort(key=lambda x: x["similarity"], reverse=True)

    docs = sorted(groups.values(), key=lambda d: d["pasal"][0]["similarity"], reverse=True)
    return docs[:max_documents]


def _attach_document_status(supabase: Client, sources: list[dict]) -> list[dict]:
    if not sources:
        return sources

    try:
        rows = legal_document_repository.list_statuses_by_uris(supabase, [s["frbr_uri"] for s in sources])
        status_by_uri = {r["frbr_uri"]: r.get("status_hukum") for r in rows}
    except Exception as e:
        logger.warning(f"[TRIAGE] Gagal ambil status_hukum sumber dokumen: {e}")
        return sources

    for s in sources:
        s["status_hukum"] = status_by_uri.get(s["frbr_uri"], s.get("status_hukum"))
    return sources


def _clean_list(values) -> list[str]:
    return [str(v).strip() for v in (values or []) if str(v).strip()]


def _build_draft(kategori: str, fn_args: dict) -> dict | None:
    ringkasan = (fn_args.get("ringkasan_kasus") or "").strip()
    if not ringkasan:
        return None

    dimiliki = _clean_list(fn_args.get("bukti_dimiliki"))
    sudah_ada = {b.lower() for b in dimiliki}
    perlu = [b for b in _clean_list(fn_args.get("bukti_perlu_disiapkan")) if b.lower() not in sudah_ada]

    deskripsi = ringkasan
    if dimiliki:
        deskripsi += "\n\nBukti yang sudah saya miliki: " + ", ".join(dimiliki) + "."

    return {
        "kategori": kategori,
        "ringkasan_kasus": ringkasan,
        "bukti_dimiliki": dimiliki,
        "bukti_perlu_disiapkan": perlu,
        "deskripsi_kasus": deskripsi,
    }


def _filter_by_kota(consultants: list[dict], kota: str) -> tuple[list[dict], bool]:
    """Saring konsultan berdasarkan kota. Kalau tidak ada yang cocok, kembalikan semua dan tandai."""
    if not kota:
        return consultants, False
    di_kota = [c for c in consultants if kota.lower() in (c.get("kota_praktik") or "").lower()]
    if di_kota:
        return di_kota, False
    return consultants, bool(consultants)


def _execute_tool(supabase: Client, fn_name: str, fn_args: dict) -> dict:
    if fn_name != TOOL_NAME:
        return {"error": f"Unknown tool: {fn_name}", "consultants": [], "draft": None}

    kategori = fn_args.get("kategori") or "Umum"
    params = {"p_spesialisasi": kategori}
    if fn_args.get("max_budget") is not None:
        params["p_max_budget"] = fn_args["max_budget"]

    draft = _build_draft(kategori, fn_args)
    try:
        consultants = consultant_repository.search_by_category(supabase, params)
    except Exception as e:
        logger.error(f"[TOOL] {TOOL_NAME} gagal mencari konsultan: {e}")
        return {"error": str(e), "consultants": [], "draft": draft}

    kota = (fn_args.get("kota") or "").strip()
    consultants, kota_tidak_ditemukan = _filter_by_kota(consultants, kota)
    logger.info(
        f"[TOOL] {TOOL_NAME} -> {len(consultants)} konsultan (kategori={kategori}, kota={kota or '-'}, "
        f"draft={'ya' if draft else 'tidak'})"
    )
    return {
        "consultants": consultants,
        "draft": draft,
        "kota": kota,
        "kota_tidak_ditemukan": kota_tidak_ditemukan,
    }


def _tool_result_for_model(result: dict) -> dict:
    """Versi ringkas hasil tool untuk dikirim balik ke model, tanpa bio dan foto konsultan."""
    if result.get("error"):
        return {"error": result["error"], "jumlah_konsultan": 0, "draft_dibuat": bool(result.get("draft"))}
    return {
        "jumlah_konsultan": len(result["consultants"]),
        "konsultan": [
            {
                "nama": c.get("nama_lengkap"),
                "kota": c.get("kota_praktik"),
                "tarif_per_sesi": c.get("tarif_per_sesi"),
            }
            for c in result["consultants"][:5]
        ],
        "kota_diminta": result.get("kota") or None,
        "tidak_ada_konsultan_di_kota_diminta": result.get("kota_tidak_ditemukan", False),
        "draft_dibuat": bool(result.get("draft")),
    }


def _summarize_consultants(consultants: list[dict]) -> str:
    if not consultants:
        return "Tidak ditemukan konsultan."
    names = [c.get("nama_lengkap", "?") for c in consultants[:5]]
    return f"Ditemukan {len(consultants)} konsultan: {', '.join(names)}"


def _build_contents(
    chat_history: list[dict],
    user_query: str,
    pasal_context: str,
) -> list[types.Content]:
    contents: list[types.Content] = []

    for msg in chat_history:
        raw_role = msg.get("role", "user")
        role = "user" if raw_role == "user" else "model"
        text = msg.get("content", msg.get("text", ""))

        meta = msg.get("metadata") or {}
        if role == "model" and meta.get("type") in ("consultant_list", "consultation_draft"):
            summary = _summarize_consultants(meta.get("consultants", []))
            draft = meta.get("draft_konsultasi")
            if draft:
                summary = f"Draft pengajuan konsultasi sudah dibuat ({draft.get('kategori')}). {summary}"
            text = f"{text}\n\n[Konteks internal: {summary}]"

        if text.strip():
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

    user_parts = [types.Part.from_text(text=user_query)]
    if pasal_context:
        user_parts.append(types.Part.from_text(text=f"\n---\nKONTEKS PASAL HUKUM YANG RELEVAN:\n{pasal_context}"))
    contents.append(types.Content(role="user", parts=user_parts))

    return contents


def _smart_truncate(contents: list[types.Content]) -> list[types.Content]:
    if not contents:
        return contents

    last_msg = contents[-1]
    history = contents[:-1]

    total_chars = sum(sum(len(p.text or "") for p in c.parts if hasattr(p, "text")) for c in history)

    while total_chars > MAX_HISTORY_CHARS and history:
        removed = history.pop(0)
        removed_chars = sum(len(p.text or "") for p in removed.parts if hasattr(p, "text"))
        total_chars -= removed_chars
        logger.info(f"[TRUNCATE] Buang 1 pesan lama ({removed_chars} chars), sisa {total_chars}")

    return history + [last_msg]


def _is_model_unavailable(error: Exception) -> bool:
    return any(marker in str(error) for marker in MODEL_UNAVAILABLE_MARKERS)


def _generate_with_first_available_model(client: genai.Client, contents: list, config, retry: int):
    for model_name in AGENT_MODELS:
        try:
            logger.info(f"[AGENT] Mencoba model: {model_name} (retry={retry})")
            return client.models.generate_content(model=model_name, contents=contents, config=config)
        except Exception as e:
            if not _is_model_unavailable(e):
                raise
            logger.warning(f"[AGENT] Model {model_name} tidak tersedia ({type(e).__name__}). Mencoba fallback...")
    return None


def _generate_with_retry(client: genai.Client, contents: list, config):
    for retry in range(AGENT_MAX_RETRIES + 1):
        response = _generate_with_first_available_model(client, contents, config, retry)
        if response is not None:
            return response

        if retry < AGENT_MAX_RETRIES:
            wait_time = 2 * (retry + 1)
            logger.warning(f"[AGENT] Semua model gagal, retry setelah {wait_time}s...")
            time.sleep(wait_time)

    raise Exception("RESOURCE_EXHAUSTED: Semua model tidak tersedia setelah retry (429/503).")


def _tool_response_content(name: str, tool_result: dict) -> types.Content:
    return types.Content(
        role="tool",
        parts=[types.Part.from_function_response(name=name, response=tool_result)],
    )


FALLBACK_JAWABAN = "Maaf, saya mengalami kesulitan memproses permintaan Anda. Silakan coba lagi."


def _response_text(response) -> str:
    try:
        text = response.text or ""
    except Exception as e:
        logger.warning(f"[AGENT] Teks jawaban tidak bisa dibaca: {e}")
        return FALLBACK_JAWABAN
    return text if text.strip() else FALLBACK_JAWABAN


def _generate_config(system_instruction: str, tools: ToolMode, sudah_memanggil_tool: bool):
    config = {
        "system_instruction": system_instruction,
        "temperature": TEMPERATURE,
        "max_output_tokens": 2048,
    }
    if tools == ToolMode.TIDAK_ADA:
        return types.GenerateContentConfig(**config)

    # Mode ANY memaksa model memanggil fungsi di SETIAP giliran. Setelah tool dijalankan, mode harus
    # diganti NONE, kalau tidak model tidak akan pernah menulis jawaban teks.
    if sudah_memanggil_tool:
        calling = types.FunctionCallingConfig(mode="NONE")
    elif tools == ToolMode.PAKSA:
        calling = types.FunctionCallingConfig(mode="ANY", allowed_function_names=[TOOL_NAME])
    else:
        calling = types.FunctionCallingConfig(mode="AUTO")

    config["tools"] = [KONSULTASI_TOOL]
    config["tool_config"] = types.ToolConfig(function_calling_config=calling)
    return types.GenerateContentConfig(**config)


def agentic_generate(
    query: str,
    context: str,
    chat_history: list[dict],
    supabase: Client,
    system_instruction: str,
    tools: ToolMode,
) -> dict:
    client = _get_gemini_client()
    contents = _smart_truncate(_build_contents(chat_history, query, context))

    tool_result = None
    response = None
    # Paling banyak satu tool call, lalu satu giliran lagi untuk menulis jawaban.
    for _ in range(2):
        config = _generate_config(system_instruction, tools, tool_result is not None)
        response = _generate_with_retry(client, contents, config)

        if tool_result is not None or not response.function_calls:
            break

        fc = response.function_calls[0]
        logger.info(f"[AGENT] Tool call: {fc.name}({fc.args})")
        tool_result = _execute_tool(supabase, fc.name, fc.args or {})
        contents.append(response.candidates[0].content)
        contents.append(_tool_response_content(fc.name, _tool_result_for_model(tool_result)))

    jawaban = _response_text(response)
    if tool_result is None:
        return {"type": "text", "jawaban": jawaban}

    consultants = tool_result.get("consultants", [])
    draft = tool_result.get("draft")
    if draft:
        response_type = "consultation_draft"
    elif consultants:
        response_type = "consultant_list"
    else:
        response_type = "text"
    return {"type": response_type, "jawaban": jawaban, "consultants": consultants, "draft_konsultasi": draft}


def _klasifikasi_metadata(klasifikasi: chat_policy.Klasifikasi, gaya: Gaya, mode: Mode, fallback: bool) -> dict:
    return {
        "intent": klasifikasi.intent.value,
        "tekanan": klasifikasi.tekanan.value,
        "gaya": gaya.value,
        "mode": mode.value,
        "fallback": fallback,
    }


def _retrieve(supabase: Client, search_query: str, kategori: Optional[str]) -> list[dict]:
    query_embedding = embed_query(search_query)
    logger.info(f"[TRIAGE] Embedded (dim={len(query_embedding)})")
    pasals = retrieve_pasals(
        supabase=supabase,
        query_embedding=query_embedding,
        match_count=5,
        match_threshold=0.5,
        filter_kategori=kategori,
    )
    logger.info(f"[TRIAGE] {len(pasals)} pasal ditemukan")
    return pasals


def triage(
    query: str,
    supabase: Client,
    kategori: Optional[str] = None,
    chat_history: list[dict] = None,
) -> dict:
    logger.info(f"[TRIAGE] Query masuk: {query[:100]}")
    history = chat_history or []
    current_step = "init"

    try:
        current_step = "classify"
        klasifikasi = chat_policy.classify(_get_gemini_client(), query, history)
        fallback = klasifikasi is None
        if fallback:
            logger.warning("[TRIAGE] Classifier gagal, memakai klasifikasi cadangan.")
            klasifikasi = chat_policy.fallback_klasifikasi(query, history)

        gaya = chat_policy.gaya_sesi(klasifikasi.gaya, history)
        mode = chat_policy.resolve_mode(klasifikasi)
        meta = _klasifikasi_metadata(klasifikasi, gaya, mode, fallback)
        logger.info(f"[TRIAGE] Mode: {mode.value} (gaya sesi={gaya.value})")

        if mode == Mode.KRISIS:
            return {
                "type": "text",
                "jawaban": chat_policy.krisis_response(gaya),
                "consultants": [],
                "draft_konsultasi": None,
                "pasal_referensi": [],
                "sumber_dokumen": [],
                "disclaimer": "",
                "klasifikasi": meta,
            }

        pasals = []
        if chat_policy.needs_retrieval(mode):
            current_step = "retrieve"
            pasals = _retrieve(supabase, klasifikasi.query_pencarian or query, kategori)

        current_step = "build_context"
        context = _build_context(pasals)
        references = _build_references(pasals)
        sources = _attach_document_status(supabase, _build_source_documents(pasals))

        current_step = "agentic_generate"
        tools = chat_policy.tool_mode(mode, klasifikasi.tekanan)
        result = agentic_generate(
            query=query,
            context=context,
            chat_history=history,
            supabase=supabase,
            system_instruction=chat_policy.build_system_instruction(mode, klasifikasi, gaya, tools),
            tools=tools,
        )
        logger.info(f"[TRIAGE] Result type: {result['type']}")

        memuat_hukum = mode in (Mode.INFORMASI, Mode.ARAHKAN_KONSULTASI, Mode.REKOMENDASI_KONSULTAN)
        return {
            "type": result["type"],
            "jawaban": result["jawaban"],
            "consultants": result.get("consultants", []),
            "draft_konsultasi": result.get("draft_konsultasi"),
            "pasal_referensi": references,
            "sumber_dokumen": sources,
            "disclaimer": DISCLAIMER if memuat_hukum else "",
            "klasifikasi": meta,
        }
    except Exception as e:
        logger.error(f"[TRIAGE] Error at step '{current_step}': {type(e).__name__}: {e}", exc_info=True)
        raise RuntimeError(f"RAG pipeline failed at step '{current_step}': {type(e).__name__}: {str(e)[:200]}") from e
