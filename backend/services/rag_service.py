import logging
import re
import time
from dataclasses import asdict
from typing import Optional

import voyageai
from google import genai
from google.genai import types
from supabase import Client

from core.config import get_settings
from helpers import gemini_errors
from helpers.embedding import get_voyage_client
from helpers.peraturan_files import get_file_info
from repositories import legal_document_repository
from services import chat_policy, konsultan_matching, retrieval_service
from services.chat_policy import Gaya, Mode, ToolMode

logger = logging.getLogger(__name__)


EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIM = 1024
LLM_MODEL = "gemini-3.1-flash-lite"


# Gemini tidak menyimpan percakapan, jadi riwayat dikirim ulang di setiap panggilan dan menjadi bagian token
# terbesar. Fakta penting dari awal percakapan tetap terbawa lewat draft konsultasi.
MAX_HISTORY_MESSAGES = 10
MAX_HISTORY_CHARS = 12_000
TEMPERATURE = 0.3

# Pasal hasil pencarian yang dikirim ke model. Ada pasal yang panjangnya lebih dari 7.000 huruf (±2.000 token);
# user tetap bisa membaca pasal lengkapnya di panel sumber.
MAX_PASAL_KONTEKS = 3
MAX_CHARS_PER_PASAL = 2_000

TANPA_PASAL = "(Tidak ditemukan pasal yang relevan di database LangkahLegal.)"
_KUTIPAN_PASAL = re.compile(r"\bpasal\s+(\d+[a-z]?)\b", re.I)

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


AGENT_MODELS = ("gemini-3.1-flash-lite", "gemini-3.5-flash-lite")
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


def cari_pasal(supabase: Client, pertanyaan: str, query_pencarian: str, kategori: Optional[str] = None) -> list[dict]:
    return retrieval_service.cari_pasal(supabase, pertanyaan, query_pencarian, kategori, jumlah=MAX_PASAL_KONTEKS)


def _build_context(pasals: list[dict]) -> str:
    if not pasals:
        return ""

    parts = []
    for i, p in enumerate(pasals, 1):
        header = f"[Sumber {i}] {p.get('nama_uu', '')} — {p.get('pasal_bagian', '')}"
        if p.get("judul_bab") and not p.get("penjelasan"):
            header += f" ({p['judul_bab']})"
        if p.get("penjelasan"):
            header += " [penjelasan resmi, bukan bunyi pasal]"
        if not p.get("yakin", True):
            header += " [kecocokan rendah]"
        if p.get("catatan"):
            header += f"\nCatatan: {p['catatan']}"
        parts.append(f"{header}\n{_potong(p.get('isi_teks', ''), MAX_CHARS_PER_PASAL)}")

    return "\n\n---\n\n".join(parts)


def _potong(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + " ... (dipotong)"


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


def _build_source_documents(pasals: list[dict]) -> list[dict]:
    """Kelompokkan pasal yang dikirim ke model per dokumen, urut sesuai peringkat pencarian."""
    groups: dict[str, dict] = {}
    for p in pasals:
        frbr_uri = p.get("frbr_uri")
        id_dokumen = p.get("id_dokumen")
        similarity = round(p.get("similarity", 0), 4)
        if not frbr_uri or id_dokumen is None:
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

    return list(groups.values())


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


def _execute_tool(
    supabase: Client, fn_name: str, fn_args: dict, pref: Optional[dict] = None, cari: bool = True
) -> dict:
    """Jalankan siapkan_konsultasi. `cari=False` dipakai saat Kia baru akan menanyakan budget dan jadwal: yang
    diambil dari tool hanya kategori, kota, dan draft kasus; pencarian konsultan menunggu jawaban klien."""
    if fn_name != TOOL_NAME:
        return {"error": f"Unknown tool: {fn_name}", "consultants": [], "draft": None}

    kategori = fn_args.get("kategori") or "Umum"
    kota = (fn_args.get("kota") or "").strip()
    pref = dict(pref or {})
    if fn_args.get("max_budget") and not pref.get("budget_max"):
        pref["budget_max"] = fn_args["max_budget"]
    draft = _build_draft(kategori, fn_args)
    base = {"draft": draft, "kategori": kategori, "kota": kota, "consultants": [], "hasil": None}
    if not cari:
        return base

    try:
        hasil = asdict(konsultan_matching.cari_konsultan(supabase, kategori, pref, kota))
    except Exception as e:
        logger.error(f"[TOOL] {TOOL_NAME} gagal mencari konsultan: {e}")
        return {**base, "error": str(e)}
    logger.info(
        f"[TOOL] {TOOL_NAME} -> {len(hasil['konsultan'])} konsultan (kategori={hasil['kategori']}, "
        f"kota={kota or '-'}, draft={'ya' if draft else 'tidak'})"
    )
    return {**base, "consultants": hasil["konsultan"], "kategori": hasil["kategori"], "hasil": hasil}


def _tool_result_for_model(result: dict) -> dict:
    """Versi ringkas hasil tool untuk dikirim balik ke model, tanpa bio dan foto konsultan."""
    if result.get("error"):
        return {"error": result["error"], "jumlah_konsultan": 0, "draft_dibuat": bool(result.get("draft"))}
    hasil = result.get("hasil")
    if hasil is None:
        return {"draft_dibuat": bool(result.get("draft")), "menunggu_preferensi_budget_dan_jadwal": True}
    return {
        "jumlah_konsultan": len(result["consultants"]),
        "konsultan": [
            {
                "nama": c.get("nama_lengkap"),
                "kota": c.get("kota_praktik"),
                "tarif_per_sesi": c.get("tarif_per_sesi"),
                "jadwal": c.get("jadwal_status"),
            }
            for c in result["consultants"]
        ],
        "kategori_dipakai": hasil["kategori"],
        "kategori_diganti_umum": hasil["kategori_cadangan"],
        "budget_dilonggarkan": hasil["budget_dilonggarkan"],
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


def _content_chars(content: types.Content) -> int:
    return sum(len(p.text or "") for p in content.parts if hasattr(p, "text"))


def _smart_truncate(contents: list[types.Content]) -> list[types.Content]:
    """Sisakan pesan riwayat terbaru dalam batas jumlah pesan dan jumlah huruf. Pesan terakhir selalu utuh."""
    if not contents:
        return contents

    last_msg = contents[-1]
    history = contents[:-1][-MAX_HISTORY_MESSAGES:]
    total_chars = sum(_content_chars(c) for c in history)

    while history and (total_chars > MAX_HISTORY_CHARS or history[0].role != "user"):
        # Riwayat juga dibuang sampai diawali pesan klien, supaya urutan giliran tetap klien lalu Kia.
        total_chars -= _content_chars(history.pop(0))

    dibuang = len(contents) - 1 - len(history)
    if dibuang:
        logger.info(f"[TRUNCATE] {dibuang} pesan lama tidak dikirim, sisa {len(history)} pesan ({total_chars} chars)")
    return history + [last_msg]


def _is_model_unavailable(error: Exception) -> bool:
    return any(marker in str(error) for marker in MODEL_UNAVAILABLE_MARKERS)


def _generate_with_first_available_model(client: genai.Client, contents: list, config, retry: int):
    """Coba model satu per satu. Mengembalikan (response, semua_gagal_karena_kuota)."""
    semua_kuota = True
    for model_name in AGENT_MODELS:
        try:
            logger.info(f"[AGENT] Mencoba model: {model_name} (retry={retry})")
            return client.models.generate_content(model=model_name, contents=contents, config=config), False
        except Exception as e:
            if not _is_model_unavailable(e):
                raise
            semua_kuota = semua_kuota and gemini_errors.is_quota_error(e)
            logger.warning(
                f"[AGENT] Model {model_name} tidak tersedia ({gemini_errors.describe(e)}). Mencoba fallback..."
            )
    return None, semua_kuota


def _generate_with_retry(client: genai.Client, contents: list, config):
    for retry in range(AGENT_MAX_RETRIES + 1):
        response, semua_kuota = _generate_with_first_available_model(client, contents, config, retry)
        if response is not None:
            return response

        # Kuota habis tidak pulih dalam hitungan detik; retry hanya menghabiskan request dan membuat user menunggu.
        if semua_kuota:
            break
        if retry < AGENT_MAX_RETRIES:
            wait_time = 2 * (retry + 1)
            logger.warning(f"[AGENT] Semua model gagal, retry setelah {wait_time}s...")
            time.sleep(wait_time)

    raise Exception("RESOURCE_EXHAUSTED: Semua model tidak tersedia setelah retry (429/503).")


def _tool_response_content(name: str, tool_result: dict) -> types.Content:
    # Role "user", sama seperti automatic function calling di SDK google-genai. Role "tool" kadang ditolak
    # Gemini API dengan 400 "Role 'tool' is not supported".
    return types.Content(
        role="user",
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


def _generate_config(system_instruction: str, tools: ToolMode, sudah_memanggil_tool: bool, max_output_tokens: int):
    config = {
        "system_instruction": system_instruction,
        "temperature": TEMPERATURE,
        "max_output_tokens": max_output_tokens,
    }
    if tools == ToolMode.TIDAK_ADA:
        return types.GenerateContentConfig(**config)

    # Mode ANY memaksa model memanggil fungsi di SETIAP giliran. Setelah tool dijalankan, mode harus
    # diganti NONE, kalau tidak model tidak akan pernah menulis jawaban teks.
    if sudah_memanggil_tool:
        calling = types.FunctionCallingConfig(mode="NONE")
    else:
        calling = types.FunctionCallingConfig(mode="ANY", allowed_function_names=[TOOL_NAME])

    config["tools"] = [KONSULTASI_TOOL]
    config["tool_config"] = types.ToolConfig(function_calling_config=calling)
    return types.GenerateContentConfig(**config)


def _log_jika_terpotong(response) -> None:
    try:
        alasan = response.candidates[0].finish_reason
    except (AttributeError, IndexError, TypeError):
        return
    if alasan == types.FinishReason.MAX_TOKENS:
        logger.warning("[AGENT] Jawaban terpotong karena batas max_output_tokens.")


def agentic_generate(
    query: str,
    context: str,
    chat_history: list[dict],
    supabase: Client,
    system_instruction: str,
    mode: Mode,
    gaya: Gaya,
    pref: Optional[dict] = None,
    tanya_preferensi: bool = False,
) -> dict:
    client = _get_gemini_client()
    contents = _smart_truncate(_build_contents(chat_history, query, context))
    tools = chat_policy.tool_mode(mode)
    max_output_tokens = chat_policy.MAX_OUTPUT_TOKENS[mode]

    tool_result = None
    response = None
    jawaban = None
    # Paling banyak satu tool call, lalu satu giliran lagi untuk menulis jawaban.
    for _ in range(2):
        config = _generate_config(system_instruction, tools, tool_result is not None, max_output_tokens)
        response = _generate_with_retry(client, contents, config)
        _log_jika_terpotong(response)

        if tool_result is not None or not response.function_calls:
            break

        fc = response.function_calls[0]
        logger.info(f"[AGENT] Tool call: {fc.name}({fc.args})")
        tool_result = _execute_tool(supabase, fc.name, fc.args or {}, pref, cari=not tanya_preferensi)
        if mode == Mode.REKOMENDASI_KONSULTAN:
            # Jawabannya cukup ditentukan hasil pencarian (atau pertanyaan preferensi), jadi panggilan kedua
            # yang mengirim ulang seluruh riwayat tidak diperlukan.
            if tanya_preferensi:
                jawaban = chat_policy.tanya_preferensi_response(gaya, tool_result["kategori"])
            else:
                jawaban = _jawaban_rekomendasi(gaya, tool_result)
            break
        contents.append(response.candidates[0].content)
        contents.append(_tool_response_content(fc.name, _tool_result_for_model(tool_result)))

    if jawaban is None:
        jawaban = _response_text(response)
        if tanya_preferensi and tool_result is not None:
            jawaban = f"{jawaban}\n\n{chat_policy.tanya_preferensi_response(gaya, tool_result['kategori'])}"
    if tool_result is None:
        return {"type": "text", "jawaban": jawaban}

    draft = tool_result.get("draft")
    if tanya_preferensi:
        return {
            "type": "tanya_preferensi",
            "jawaban": jawaban,
            "consultants": [],
            "draft_konsultasi": draft,
            "form_preferensi": chat_policy.form_preferensi(tool_result["kategori"], pref),
            "konteks_konsultasi": {
                "mode_asal": mode.value,
                "kategori": tool_result["kategori"],
                "kota": tool_result.get("kota") or "",
                "draft": draft,
            },
        }

    consultants = tool_result.get("consultants", [])
    return {
        "type": _tipe_hasil_konsultan(draft, consultants),
        "jawaban": jawaban,
        "consultants": consultants,
        "draft_konsultasi": draft,
    }


def _tipe_hasil_konsultan(draft: Optional[dict], consultants: list[dict]) -> str:
    if draft:
        return "consultation_draft"
    return "consultant_list" if consultants else "text"


def _jawaban_rekomendasi(gaya: Gaya, tool_result: dict) -> str:
    if tool_result.get("error"):
        return chat_policy.rekomendasi_response(gaya, {"error": tool_result["error"]})
    hasil = {**(tool_result.get("hasil") or {}), "kota": tool_result.get("kota")}
    return chat_policy.rekomendasi_response(gaya, hasil, ada_draft=bool(tool_result.get("draft")))


def _klasifikasi_metadata(klasifikasi: chat_policy.Klasifikasi, gaya: Gaya, mode: Mode, fallback: bool) -> dict:
    return {
        "intent": klasifikasi.intent.value,
        "tekanan": klasifikasi.tekanan.value,
        "gaya": gaya.value,
        "mode": mode.value,
        "fallback": fallback,
    }


def _kutipan_tanpa_sumber(jawaban: str, context: str, query: str, chat_history: list[dict]) -> list[str]:
    """Nomor pasal di jawaban yang tidak muncul di konteks pasal, pertanyaan, maupun riwayat terakhir.

    Pasal seperti ini kemungkinan dikarang model atau berasal dari ingatannya, bukan dari database.
    """
    riwayat = [m.get("content") or "" for m in chat_history[-MAX_HISTORY_MESSAGES:]]
    ada = {n.upper() for n in _KUTIPAN_PASAL.findall(" ".join([context, query, *riwayat]))}
    return sorted({n.upper() for n in _KUTIPAN_PASAL.findall(jawaban)} - ada)


def _disclaimer(mode: Mode, kutipan_tanpa_sumber: list[str]) -> str:
    if mode not in (Mode.INFORMASI, Mode.ARAHKAN_KONSULTASI, Mode.REKOMENDASI_KONSULTAN):
        return ""
    if not kutipan_tanpa_sumber:
        return DISCLAIMER
    daftar = ", ".join(f"Pasal {n}" for n in kutipan_tanpa_sumber)
    return f"{DISCLAIMER} {daftar} yang disebut di atas tidak berasal dari sumber yang ditampilkan, mohon dipastikan ulang."


MODE_KONSULTASI = (Mode.ARAHKAN_KONSULTASI, Mode.REKOMENDASI_KONSULTAN)


def _metadata_ai_terakhir(history: list[dict]) -> dict:
    for msg in reversed(history):
        if msg.get("role") != "user":
            return msg.get("metadata") or {}
    return {}


def _preferensi_sesi(history: list[dict]) -> Optional[dict]:
    """Preferensi budget/jadwal terakhir yang pernah diberikan klien di sesi ini (termasuk kalau dilewati)."""
    for msg in reversed(history):
        if msg.get("role") == "user":
            pref = (msg.get("metadata") or {}).get("preferensi")
            if pref:
                return pref
    return None


# Preferensi yang diganti sebagai satu kesatuan: "yang bisa malam" setelah "sabtu pagi" berarti malam hari apa saja,
# bukan sabtu malam.
_KELOMPOK_PREFERENSI = (("budget_min", "budget_max"), ("hari", "waktu"))


def _gabung_preferensi(lama: Optional[dict], baru: dict) -> Optional[dict]:
    """Preferensi yang baru disebut menimpa yang lama. None berarti klien belum pernah memberi preferensi."""
    if not lama and not baru:
        return None
    gabungan = {k: v for k, v in (lama or {}).items() if k != "dilewati"}
    for kelompok in _KELOMPOK_PREFERENSI:
        if any(k in baru for k in kelompok):
            for k in kelompok:
                gabungan.pop(k, None)
    gabungan.update(baru)
    if not baru and (lama or {}).get("dilewati"):
        gabungan["dilewati"] = True
    return gabungan


def _gaya_terakhir(history: list[dict]) -> Gaya:
    for msg in reversed(history):
        gaya = ((msg.get("metadata") or {}).get("klasifikasi") or {}).get("gaya")
        if msg.get("role") == "user" and gaya in (Gaya.FORMAL.value, Gaya.KASUAL.value):
            return Gaya(gaya)
    return Gaya.FORMAL


def _lanjut_dari_form(supabase: Client, history: list[dict], konteks: dict, preferensi: dict) -> dict:
    """Klien mengisi form budget/jadwal yang ditanyakan Kia: cari konsultan tanpa memanggil Gemini.

    Kategori, kota, dan draft kasus sudah didapat saat Kia bertanya (lihat agentic_generate).
    """
    gaya = chat_policy.gaya_sesi(_gaya_terakhir(history), history)
    pref = {k: v for k, v in preferensi.items() if v not in (None, "")}
    kategori = pref.pop("kategori", None) or konteks.get("kategori") or "Umum"
    draft = dict(konteks["draft"]) if konteks.get("draft") else None
    if draft:
        draft["kategori"] = kategori

    tool_result = {"kategori": kategori, "kota": konteks.get("kota") or "", "draft": draft}
    try:
        hasil = asdict(konsultan_matching.cari_konsultan(supabase, kategori, pref, tool_result["kota"]))
        tool_result.update({"hasil": hasil, "consultants": hasil["konsultan"]})
    except Exception as e:
        logger.error(f"[TRIAGE] Pencarian konsultan dari form gagal: {e}")
        tool_result.update({"error": str(e), "consultants": []})

    mode_asal = konteks.get("mode_asal") or Mode.REKOMENDASI_KONSULTAN.value
    return {
        "type": _tipe_hasil_konsultan(draft, tool_result["consultants"]),
        "jawaban": _jawaban_rekomendasi(gaya, tool_result),
        "consultants": tool_result["consultants"],
        "draft_konsultasi": draft,
        "pasal_referensi": [],
        "sumber_dokumen": [],
        "disclaimer": DISCLAIMER,
        "preferensi": {**pref, "kategori": kategori},
        "klasifikasi": {"intent": "minta_konsultan", "gaya": gaya.value, "mode": mode_asal, "dari_form": True},
    }


def triage(
    query: str,
    supabase: Client,
    kategori: Optional[str] = None,
    chat_history: list[dict] = None,
    preferensi: Optional[dict] = None,
) -> dict:
    """Proses satu pesan klien.

    `preferensi` diisi frontend saat klien mengirim form budget/jadwal yang ditanyakan Kia.
    """
    logger.info(f"[TRIAGE] Query masuk: {query[:100]}")
    history = chat_history or []
    current_step = "init"

    try:
        terakhir = _metadata_ai_terakhir(history)
        if preferensi is not None and terakhir.get("type") == "tanya_preferensi":
            current_step = "lanjut_dari_form"
            return _lanjut_dari_form(supabase, history, terakhir.get("konteks_konsultasi") or {}, preferensi)

        retrieval_service.panaskan_korpus(supabase)
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
            pasals = cari_pasal(supabase, query, klasifikasi.query_pencarian or query, kategori)

        current_step = "build_context"
        context = _build_context(pasals) or (TANPA_PASAL if chat_policy.needs_retrieval(mode) else "")
        references = _build_references(pasals)
        sources = _attach_document_status(supabase, _build_source_documents(pasals))

        # Budget/jadwal ditanyakan sekali per sesi, kecuali klien sudah menyebutnya sendiri.
        pref = None
        if mode in MODE_KONSULTASI:
            pref = _gabung_preferensi(_preferensi_sesi(history), klasifikasi.preferensi())
        tanya_preferensi = mode in MODE_KONSULTASI and pref is None

        current_step = "agentic_generate"
        result = agentic_generate(
            query=query,
            context=context,
            chat_history=history,
            supabase=supabase,
            system_instruction=chat_policy.build_system_instruction(mode, klasifikasi, gaya),
            mode=mode,
            gaya=gaya,
            pref=pref,
            tanya_preferensi=tanya_preferensi,
        )
        logger.info(f"[TRIAGE] Result type: {result['type']}")

        kutipan_tanpa_sumber = _kutipan_tanpa_sumber(result["jawaban"], context, query, history)
        if kutipan_tanpa_sumber:
            logger.warning(f"[TRIAGE] Pasal disebut tanpa sumber: {kutipan_tanpa_sumber}")
        meta["kutipan_tanpa_sumber"] = kutipan_tanpa_sumber
        return {
            "type": result["type"],
            "jawaban": result["jawaban"],
            "consultants": result.get("consultants", []),
            "draft_konsultasi": result.get("draft_konsultasi"),
            "pasal_referensi": references,
            "sumber_dokumen": sources,
            "disclaimer": _disclaimer(mode, kutipan_tanpa_sumber),
            "klasifikasi": meta,
            "preferensi": pref,
            "form_preferensi": result.get("form_preferensi"),
            "konteks_konsultasi": result.get("konteks_konsultasi"),
        }
    except Exception as e:
        logger.error(f"[TRIAGE] Error at step '{current_step}': {type(e).__name__}: {e}", exc_info=True)
        raise RuntimeError(f"RAG pipeline failed at step '{current_step}': {type(e).__name__}: {str(e)[:200]}") from e
