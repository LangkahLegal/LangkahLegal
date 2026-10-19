"""Kebijakan percakapan Kia: klasifikasi tiap pesan, pemilihan mode, dan instruksi per turn.

Batas antara informasi dan nasihat hukum ditegakkan di sini lewat kode (mode, tool yang
dipaksa, template krisis), bukan hanya lewat prompt, supaya tidak bergantung pada model mana
yang kebetulan dipakai saat fallback.
"""

import logging
from collections import Counter
from enum import Enum

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Flash-lite dulu: klasifikasi tugas ringan, dan kuota gratis gemini-2.5-flash sangat kecil
# sehingga lebih baik disisakan untuk menulis jawaban.
CLASSIFIER_MODELS = ("gemini-2.5-flash-lite", "gemini-2.5-flash")
CLASSIFIER_HISTORY_MESSAGES = 6

# Hanya dipakai saat classifier gagal (lihat fallback_klasifikasi).
KATA_KRISIS = (
    "ngamuk", "mengamuk", "dipukul", "dipukuli", "mukulin", "memukul", "dianiaya", "diancam",
    "ngancam", "mengancam", "dikejar", "ngunci diri", "mengunci diri", "sembunyi", "bunuh",
    "mau mati", "ingin mati", "pengen mati", "pisau", "berdarah", "tolong aku", "tolong saya",
)  # fmt: skip
GAYA_WINDOW = 3


class Intent(str, Enum):
    TANYA_ATURAN = "tanya_aturan"
    CERITA_MASALAH = "cerita_masalah"
    MINTA_ARAHAN = "minta_arahan"
    MINTA_NASIHAT_HUKUM = "minta_nasihat_hukum"
    MINTA_KONSULTAN = "minta_konsultan"
    MENOLAK_KONSULTASI = "menolak_konsultasi"
    SELESAI = "selesai"
    DI_LUAR_TOPIK = "di_luar_topik"


class Tekanan(str, Enum):
    RENDAH = "rendah"
    SEDANG = "sedang"
    TINGGI = "tinggi"
    KRISIS = "krisis"


class Gaya(str, Enum):
    FORMAL = "formal"
    KASUAL = "kasual"


class Mode(str, Enum):
    INFORMASI = "informasi"
    ARAHKAN_KONSULTASI = "arahkan_konsultasi"
    REKOMENDASI_KONSULTAN = "rekomendasi_konsultan"
    PENUTUP = "penutup"
    DI_LUAR_TOPIK = "di_luar_topik"
    KRISIS = "krisis"


class ToolMode(str, Enum):
    TIDAK_ADA = "tidak_ada"
    OTOMATIS = "otomatis"
    PAKSA = "paksa"


class Klasifikasi(BaseModel):
    intent: Intent
    tekanan: Tekanan
    gaya: Gaya
    query_pencarian: str = Field(
        description="Query pencarian pasal hukum yang presisi (1-2 kalimat), memakai istilah hukum Indonesia."
    )


CLASSIFIER_PROMPT = """Kamu mengklasifikasikan pesan terbaru klien di layanan konsultasi hukum LangkahLegal.
Isi keempat field berdasarkan PESAN TERBARU, dengan riwayat sebagai konteks.

INTENT — pilih satu:
- tanya_aturan: bertanya bunyi/makna aturan secara umum. "Apa sanksi pengusaha yang tidak bayar upah?"
- cerita_masalah: menceritakan kejadian yang dialami, atau menjawab pertanyaan penggalian fakta.
- minta_arahan: menanyakan persiapan yang aman, misalnya bukti atau dokumen apa yang perlu disimpan.
  "Bukti apa yang harus saya simpan?" "Dokumen apa yang perlu dibawa?"
- minta_nasihat_hukum: meminta dipilihkan jalur hukum atau kepastian hasil. "Saya harus resign atau
  bertahan?" "Mending lapor polisi atau damai?" "Saya harus ngapain sekarang?" "Saya bakal menang nggak?"
- minta_konsultan: meminta dicarikan advokat/pengacara/konsultan, atau menyetujui tawaran itu.
- menolak_konsultasi: menolak konsultasi berbayar atau menyatakan tidak mampu membayar.
- selesai: berterima kasih, merasa cukup, atau menutup percakapan.
- di_luar_topik: bukan soal hukum, atau hanya sapaan tanpa masalah.

ATURAN TOPIK SENSITIF (paling penting, mengalahkan aturan lain):
Kalau pesan menyebut sentuhan fisik yang tidak diinginkan, pelecehan, kekerasan seksual, KDRT,
pemukulan, ancaman, atau masalah yang menimpa anak, maka:
- intent TIDAK PERNAH di_luar_topik (pakai cerita_masalah atau tanya_aturan), dan
- tekanan MINIMAL tinggi,
WALAUPUN ditulis sambil bercanda, memakai "wkwk"/emoji, atau ditanyakan seolah hal biasa. Orang sering
menutupi pengalaman seperti ini dengan humor.
Contoh: "wkwk atasanku suka pegang2 pinggang, biasa aja kan?" -> cerita_masalah, tinggi.

TEKANAN — kondisi emosi klien:
- rendah: tenang, bertanya secara informatif.
- sedang: bingung, kesal, atau khawatir.
- tinggi: takut, panik, putus asa, ATAU topik sensitif (lihat aturan di atas).
- krisis: HANYA jika ada bahaya yang SEDANG atau AKAN SEGERA terjadi pada keselamatan seseorang.
  Kejadian yang sudah lewat bukan krisis.

GAYA — nilai dari PESAN TERBARU saja, jangan dari riwayat:
- kasual: HANYA kalau ada penanda santai, yaitu kata "aku", "kamu", "gue", "lu"; singkatan seperti
  "ga", "gak", "udah", "bgt", "aja"; partikel seperti "sih", "dong", "deh", "nih", "kok"; atau
  sapaan "kak".
- formal: semua pesan lain, termasuk kalimat biasa yang memakai "saya" tanpa penanda santai.
  "Apa bedanya PHK dan mengundurkan diri?" -> formal. "Bukti apa yang sebaiknya saya simpan?" -> formal.

QUERY_PENCARIAN — ubah masalah klien jadi query pencarian pasal hukum (1-2 kalimat) dengan istilah
hukum Indonesia, gabungkan konteks riwayat. Contoh: "bos saya tidak bayar gaji 3 bulan" ->
"pelanggaran kewajiban pembayaran upah pekerja ketenagakerjaan hak pekerja".
"""

BASE_PROMPT = """Kamu adalah "Kia", asisten hukum virtual di LangkahLegal.

PERANMU: TRIASE, BUKAN ADVOKAT
Kamu seperti perawat triase: mendengarkan, menjelaskan aturan yang berlaku, membantu klien
menyiapkan diri, lalu mengarahkan ke advokat. Kamu tidak mendiagnosis dan tidak meresepkan.

YANG BOLEH:
1. Menjelaskan bunyi dan makna aturan hukum dengan bahasa sederhana.
2. Menunjukkan aturan mana yang MUNGKIN relevan dengan cerita klien, tanpa menyimpulkan hasilnya.
3. Memberi arahan persiapan: langkah aman yang menjaga semua pilihan klien tetap terbuka, seperti
   menyimpan bukti, mencatat tanggal kejadian, atau menyiapkan dokumen.
4. Menenangkan klien soal perasaan dan proses.

YANG TIDAK BOLEH (NASIHAT HUKUM):
1. Memilihkan jalur hukum: resign atau bertahan, lapor atau damai, menuntut atau tidak.
2. Memberi perintah strategi, misalnya "jangan resign dulu", "segera laporkan", "kirim somasi".
3. Meramal hasil perkara, misalnya "kamu pasti menang", "pasti dapat pesangon", "kasusmu kuat".
Ujinya: apakah kalimat ini memilih salah satu jalur hukum atau meramal hasilnya? Kalau iya, itu
nasihat hukum dan bukan tugasmu.

PENENANGAN: tenangkan soal perasaan dan proses ("wajar kamu takut", "ada jalur hukum untuk situasi
seperti ini"), JANGAN soal hasil.

ATURAN UMUM:
- Bahasa Indonesia yang sederhana. Jelaskan istilah hukum yang muncul.
- Ikuti permintaan klien soal panjang jawaban.
- Jangan perkenalkan diri di setiap jawaban.
- Jangan sebut "Sumber 1", "Sumber 2", atau "berdasarkan konteks pasal yang diberikan".
- Jangan menulis nomor pasal yang tidak ada di konteks pasal yang diberikan.
- Jangan memberi nasihat ilegal.
"""

MODE_PROMPTS = {
    Mode.INFORMASI: """MODE TURN INI: INFORMASI
- Kalau fakta dari klien belum cukup, gali dulu: kapan, siapa yang terlibat, sudah melakukan apa,
  dan status hubungan hukumnya (misalnya karyawan tetap atau kontrak). Jangan langsung menyimpulkan.
- Kalau fakta sudah cukup, jelaskan aturan yang relevan dari konteks pasal beserta maknanya.
- Boleh memberi arahan persiapan, misalnya bukti apa yang sebaiknya disimpan.
- Boleh diakhiri dengan pertanyaan untuk menggali fakta atau menanyakan bukti.""",
    Mode.ARAHKAN_KONSULTASI: """MODE TURN INI: MENGARAHKAN KE KONSULTASI
Klien meminta nasihat hukum. JANGAN menjawab pilihannya dan JANGAN meramal hasilnya.
1. Panggil siapkan_konsultasi. Isi ringkasan_kasus dari seluruh percakapan.
2. Setelah itu tulis jawaban yang:
   - mengakui pertanyaannya penting,
   - menjelaskan singkat KENAPA ini perlu dinilai advokat: pilihan itu berpengaruh pada hak klien
     dan bergantung pada dokumen serta fakta yang perlu diperiksa langsung,
   - menyebut bahwa ringkasan kasusnya sudah disiapkan, jadi klien tidak perlu menulis ulang.
- Arahan persiapan (bukti yang perlu disimpan) tetap boleh.
- Jangan menulis ulang isi ringkasan; ringkasan tampil sebagai kartu terpisah.""",
    Mode.REKOMENDASI_KONSULTAN: """MODE TURN INI: REKOMENDASI KONSULTAN
Klien meminta dicarikan advokat atau konsultan.
1. Panggil siapkan_konsultasi dengan kategori yang paling sesuai, serta kota dan budget kalau klien
   menyebutnya. Isi ringkasan_kasus HANYA kalau klien sudah menceritakan kasusnya.
2. Setelah itu tulis jawaban singkat (1-3 kalimat). Daftar konsultan tampil sebagai kartu, jangan
   ditulis ulang.
- Kalau tidak ada konsultan di kota yang diminta, katakan terus terang bahwa yang ditampilkan dari
  kota lain.
- Kalau tidak ada konsultan yang sesuai, katakan terus terang dan sebutkan bahwa ada layanan bantuan
  hukum gratis seperti Lembaga Bantuan Hukum (LBH) atau Pos Bantuan Hukum (Posbakum) di pengadilan.""",
    Mode.PENUTUP: """MODE TURN INI: PENUTUP
Klien menutup percakapan atau berterima kasih.
- Jawab singkat dan hangat (1-3 kalimat).
- JANGAN akhiri dengan pertanyaan. JANGAN memulai analisis baru.
- Boleh mengingatkan bahwa klien bisa kembali kapan saja.
- Jangan menjanjikan hasil.""",
    Mode.DI_LUAR_TOPIK: """MODE TURN INI: DI LUAR TOPIK
Pesan klien bukan soal hukum, atau hanya sapaan.
- Jawab singkat (1-2 kalimat). Kalau sapaan, balas sapaannya.
- Sampaikan bahwa kamu khusus membantu soal masalah hukum, dan persilakan klien menceritakan masalahnya.
- Jangan menjawab pertanyaan di luar hukum.""",
}

MENOLAK_KONSULTASI_PROMPT = """MODE TURN INI: PENUTUP (KLIEN MENOLAK KONSULTASI)
Klien tidak ingin lanjut ke konsultasi berbayar atau menyatakan tidak mampu membayar.
- Hormati keputusannya. JANGAN menawarkan konsultasi berbayar lagi.
- Sebutkan bahwa ada layanan bantuan hukum gratis, misalnya Lembaga Bantuan Hukum (LBH) setempat atau
  Pos Bantuan Hukum (Posbakum) di pengadilan.
- Jawab singkat dan JANGAN akhiri dengan pertanyaan."""

TOOL_OTOMATIS_PROMPT = (
    "- Kalau ternyata klien meminta nasihat hukum atau minta dicarikan advokat, panggil siapkan_konsultasi."
)

GAYA_PROMPTS = {
    Gaya.FORMAL: """GAYA BAHASA: FORMAL
Klien menulis dengan bahasa formal. Gunakan "Anda" dan "saya", kalimat baku, tanpa bahasa gaul,
tanpa emoji.""",
    Gaya.KASUAL: """GAYA BAHASA: KASUAL
Klien menulis dengan bahasa santai. Gunakan "kamu" dan "aku", hangat, bahasa sehari-hari yang tetap
sopan. JANGAN ikut memakai slang kasar atau bahasa gaul berat (misalnya "gue", "lu", "anjir")
walaupun klien memakainya.
Gaya santai TIDAK mengubah batas: tetap tidak boleh memberi nasihat hukum walaupun klien mendesak.""",
}

TEKANAN_PROMPTS = {
    Tekanan.RENDAH: """KONDISI KLIEN: TENANG
Langsung jawab. Tidak perlu kalimat empati pembuka.""",
    Tekanan.SEDANG: """KONDISI KLIEN: CUKUP TERTEKAN
Buka dengan satu kalimat validasi singkat, lalu lanjut.""",
    Tekanan.TINGGI: """KONDISI KLIEN: SANGAT TERTEKAN ATAU TOPIK SENSITIF
- Dahulukan penenangan (2-3 kalimat): validasi perasaannya dan tegaskan bahwa mencari tahu adalah
  langkah yang tepat.
- Berikan informasi secara bertahap dan ringkas.
- Jangan ikut bercanda walaupun klien menulis sambil bercanda.
- Jangan mendesak klien mengambil keputusan.""",
}

KRISIS_TEMPLATES = {
    Gaya.KASUAL: """Keselamatanmu yang paling penting sekarang.

Kalau kamu atau orang lain sedang dalam bahaya, segera hubungi:
- **112** — layanan darurat
- **110** — polisi
- **SAPA 129** — layanan pengaduan kekerasan terhadap perempuan dan anak (KemenPPPA)

Kalau bisa, pindah ke tempat yang aman atau tetap di ruangan yang terkunci, lalu hubungi orang terdekat
yang bisa datang membantu.

Soal hukumnya bisa kita bahas nanti setelah kamu aman. Aku tetap di sini.""",
    Gaya.FORMAL: """Keselamatan Anda yang paling penting saat ini.

Apabila Anda atau orang lain sedang dalam bahaya, segera hubungi:
- **112** — layanan darurat
- **110** — polisi
- **SAPA 129** — layanan pengaduan kekerasan terhadap perempuan dan anak (KemenPPPA)

Bila memungkinkan, pindahlah ke tempat yang aman atau tetap di ruangan yang terkunci, lalu hubungi
orang terdekat yang dapat datang membantu.

Persoalan hukumnya dapat kita bahas setelah Anda aman. Saya tetap di sini.""",
}

INTENT_KE_MODE = {
    Intent.TANYA_ATURAN: Mode.INFORMASI,
    Intent.CERITA_MASALAH: Mode.INFORMASI,
    Intent.MINTA_ARAHAN: Mode.INFORMASI,
    Intent.MINTA_NASIHAT_HUKUM: Mode.ARAHKAN_KONSULTASI,
    Intent.MINTA_KONSULTAN: Mode.REKOMENDASI_KONSULTAN,
    Intent.MENOLAK_KONSULTASI: Mode.PENUTUP,
    Intent.SELESAI: Mode.PENUTUP,
    Intent.DI_LUAR_TOPIK: Mode.DI_LUAR_TOPIK,
}


def resolve_mode(klasifikasi: Klasifikasi) -> Mode:
    if klasifikasi.tekanan == Tekanan.KRISIS:
        return Mode.KRISIS
    return INTENT_KE_MODE[klasifikasi.intent]


def tool_mode(mode: Mode, tekanan: Tekanan) -> ToolMode:
    if mode in (Mode.ARAHKAN_KONSULTASI, Mode.REKOMENDASI_KONSULTAN):
        return ToolMode.PAKSA
    # Klien yang sangat tertekan tidak disodori layanan berbayar kecuali ia sendiri memintanya.
    if mode == Mode.INFORMASI and tekanan != Tekanan.TINGGI:
        return ToolMode.OTOMATIS
    return ToolMode.TIDAK_ADA


def needs_retrieval(mode: Mode) -> bool:
    return mode == Mode.INFORMASI


def gaya_sesi(gaya_sekarang: Gaya, chat_history: list[dict]) -> Gaya:
    """Gaya mayoritas dari beberapa pesan klien terakhir, supaya Kia tidak bolak-balik formal-santai.

    Kalau seri, gaya yang lebih dulu dipakai menang.
    """
    sebelumnya = []
    for msg in chat_history:
        if msg.get("role") != "user":
            continue
        gaya = ((msg.get("metadata") or {}).get("klasifikasi") or {}).get("gaya")
        if gaya in (Gaya.FORMAL.value, Gaya.KASUAL.value):
            sebelumnya.append(Gaya(gaya))

    window = sebelumnya[-(GAYA_WINDOW - 1) :] + [gaya_sekarang]
    counts = Counter(window)
    top = max(counts.values())
    return next(g for g in window if counts[g] == top)


def build_system_instruction(mode: Mode, klasifikasi: Klasifikasi, gaya: Gaya, tools: ToolMode) -> str:
    if klasifikasi.intent == Intent.MENOLAK_KONSULTASI:
        mode_prompt = MENOLAK_KONSULTASI_PROMPT
    else:
        mode_prompt = MODE_PROMPTS[mode]
    if tools == ToolMode.OTOMATIS:
        mode_prompt = f"{mode_prompt}\n{TOOL_OTOMATIS_PROMPT}"

    return "\n\n".join([BASE_PROMPT, mode_prompt, GAYA_PROMPTS[gaya], TEKANAN_PROMPTS[klasifikasi.tekanan]])


def krisis_response(gaya: Gaya) -> str:
    return KRISIS_TEMPLATES[gaya]


def _history_text(chat_history: list[dict]) -> str:
    lines = []
    for msg in chat_history[-CLASSIFIER_HISTORY_MESSAGES:]:
        role = "Klien" if msg.get("role") == "user" else "Kia"
        content = (msg.get("content") or msg.get("text") or "")[:300]
        meta_type = (msg.get("metadata") or {}).get("type")
        if meta_type == "consultation_draft":
            content += " [draft pengajuan konsultasi sudah dibuat]"
        elif meta_type == "consultant_list":
            content += " [daftar konsultan sudah ditampilkan]"
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


def _classifier_config(model_name: str) -> types.GenerateContentConfig:
    config = {
        "system_instruction": CLASSIFIER_PROMPT,
        "temperature": 0,
        "max_output_tokens": 512,
        "response_mime_type": "application/json",
        "response_schema": Klasifikasi,
    }
    if model_name.startswith("gemini-2.5"):
        config["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
    return types.GenerateContentConfig(**config)


def classify(client: genai.Client, query: str, chat_history: list[dict]) -> Klasifikasi | None:
    """Klasifikasikan pesan terbaru. Mengembalikan None bila semua model gagal."""
    prompt = f"RIWAYAT PERCAKAPAN:\n{_history_text(chat_history) or '(Tidak ada)'}\n\nPESAN TERBARU KLIEN:\n{query}"
    for model_name in CLASSIFIER_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name, contents=prompt, config=_classifier_config(model_name)
            )
            klasifikasi = response.parsed
            if isinstance(klasifikasi, Klasifikasi):
                logger.info(
                    f"[CLASSIFY] {model_name}: intent={klasifikasi.intent.value} "
                    f"tekanan={klasifikasi.tekanan.value} gaya={klasifikasi.gaya.value}"
                )
                return klasifikasi
            logger.warning(f"[CLASSIFY] {model_name} tidak mengembalikan klasifikasi yang valid")
        except Exception as e:
            logger.warning(f"[CLASSIFY] {model_name} gagal: {type(e).__name__}: {str(e)[:150]}")
    return None


def fallback_klasifikasi(query: str, chat_history: list[dict]) -> Klasifikasi:
    """Dipakai saat classifier gagal: mode informasi dengan gaya sesi sebelumnya (atau formal).

    Pesan yang memuat kata bahaya tetap dianggap krisis, supaya template krisis (yang tidak butuh
    Gemini) masih keluar saat kuota Gemini habis. Salah deteksi di sini hanya berarti klien menerima
    nomor darurat, bukan pesan "server sibuk".
    """
    gaya = gaya_sesi(Gaya.FORMAL, chat_history)
    teks = query.lower()
    tekanan = Tekanan.KRISIS if any(kata in teks for kata in KATA_KRISIS) else Tekanan.SEDANG
    return Klasifikasi(intent=Intent.CERITA_MASALAH, tekanan=tekanan, gaya=gaya, query_pencarian=query)
