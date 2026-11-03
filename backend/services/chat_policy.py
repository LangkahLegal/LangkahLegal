"""Kebijakan percakapan Kia: klasifikasi tiap pesan, pemilihan mode, dan instruksi per turn.

Batas antara informasi dan nasihat hukum ditegakkan di sini lewat kode (mode, tool yang
dipaksa, template krisis), bukan hanya lewat prompt, supaya tidak bergantung pada model mana
yang kebetulan dipakai saat fallback.
"""

import logging
from collections import Counter
from enum import Enum
from typing import Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from helpers import gemini_errors
from helpers import preferensi as pref_helper

logger = logging.getLogger(__name__)

# Flash-lite dulu: klasifikasi tugas ringan, dan kuota gratis gemini-3.1-flash-lite sangat kecil
# sehingga lebih baik disisakan untuk menulis jawaban.
CLASSIFIER_MODELS = ("gemini-3.5-flash-lite", "gemini-3.1-flash-lite")
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
    PAKSA = "paksa"


# Batas token jawaban per mode. Jawaban singkat juga membuat riwayat yang dikirim di pesan berikutnya lebih kecil.
# Mode rekomendasi hanya dipakai untuk mengisi argumen tool (ringkasan kasus 2-4 kalimat).
MAX_OUTPUT_TOKENS = {
    Mode.INFORMASI: 1024,
    Mode.ARAHKAN_KONSULTASI: 768,
    Mode.REKOMENDASI_KONSULTAN: 512,
    Mode.PENUTUP: 256,
    Mode.DI_LUAR_TOPIK: 256,
}


class HariPreferensi(str, Enum):
    HARI_INI = "hari_ini"
    BESOK = "besok"
    LUSA = "lusa"
    MINGGU_INI = "minggu_ini"
    MINGGU_DEPAN = "minggu_depan"
    AKHIR_PEKAN = "akhir_pekan"
    HARI_KERJA = "hari_kerja"
    SENIN = "senin"
    SELASA = "selasa"
    RABU = "rabu"
    KAMIS = "kamis"
    JUMAT = "jumat"
    SABTU = "sabtu"
    MINGGU = "minggu"
    BEBAS = "bebas"


class WaktuPreferensi(str, Enum):
    PAGI = "pagi"
    SIANG = "siang"
    SORE = "sore"
    MALAM = "malam"
    BEBAS = "bebas"


class Klasifikasi(BaseModel):
    intent: Intent
    tekanan: Tekanan
    gaya: Gaya
    query_pencarian: str = Field(
        description="Query pencarian pasal hukum yang presisi (1-2 kalimat), memakai istilah hukum Indonesia."
    )
    budget_min: Optional[int] = Field(None, description="Budget minimal per sesi dalam rupiah, hanya kalau disebut.")
    budget_max: Optional[int] = Field(None, description="Budget maksimal per sesi dalam rupiah, hanya kalau disebut.")
    hari: Optional[HariPreferensi] = Field(None, description="Hari konsultasi yang diinginkan, hanya kalau disebut.")
    waktu: Optional[WaktuPreferensi] = Field(None, description="Waktu konsultasi yang diinginkan, hanya kalau disebut.")

    def preferensi(self) -> dict:
        """Preferensi konsultasi yang disebut di pesan ini (kosong kalau tidak ada)."""
        data = {
            "budget_min": self.budget_min,
            "budget_max": self.budget_max,
            "hari": self.hari.value if self.hari else None,
            "waktu": self.waktu.value if self.waktu else None,
        }
        return {k: v for k, v in data.items() if v is not None}


CLASSIFIER_PROMPT = """Klasifikasikan PESAN TERBARU klien layanan konsultasi hukum LangkahLegal; riwayat hanya konteks.

INTENT (pilih satu):
- tanya_aturan: tanya bunyi/makna aturan umum. "Apa sanksi pengusaha yang tidak bayar upah?"
- cerita_masalah: menceritakan kejadian yang dialami, atau menjawab pertanyaan penggalian fakta.
- minta_arahan: tanya persiapan aman, misal bukti/dokumen yang perlu disimpan atau dibawa.
- minta_nasihat_hukum: minta dipilihkan jalur hukum atau kepastian hasil. "Resign atau bertahan?"
  "Lapor polisi atau damai?" "Saya harus ngapain sekarang?" "Saya bakal menang nggak?"
- minta_konsultan: minta dicarikan advokat/pengacara/konsultan, atau menyetujui tawaran itu. Kalau Kia baru
  saja menanyakan budget dan jadwal konsultasi, jawaban klien soal budget/hari/jam (atau "terserah") juga
  minta_konsultan.
- menolak_konsultasi: menolak konsultasi berbayar atau tidak mampu membayar.
- selesai: berterima kasih, merasa cukup, atau menutup percakapan.
- di_luar_topik: bukan soal hukum, atau sapaan tanpa masalah.

TOPIK SENSITIF (mengalahkan aturan lain): sentuhan fisik tidak diinginkan, pelecehan, kekerasan
seksual, KDRT, pemukulan, ancaman, atau masalah anak -> intent TIDAK PERNAH di_luar_topik dan tekanan
MINIMAL tinggi, WALAUPUN ditulis bercanda/"wkwk"/emoji atau seolah hal biasa.
Contoh: "wkwk atasanku suka pegang2 pinggang, biasa aja kan?" -> cerita_masalah, tinggi.

TEKANAN:
- rendah: tenang, informatif. sedang: bingung, kesal, khawatir.
- tinggi: takut, panik, putus asa, atau topik sensitif.
- krisis: HANYA bahaya keselamatan yang SEDANG atau AKAN SEGERA terjadi. Kejadian lampau bukan krisis.

GAYA (dari pesan terbaru saja):
- kasual: HANYA jika ada "aku", "kamu", "gue", "lu", singkatan ("ga", "gak", "udah", "bgt", "aja"),
  partikel ("sih", "dong", "deh", "nih", "kok"), atau sapaan "kak".
- formal: selain itu, termasuk kalimat biasa dengan "saya". "Bukti apa yang sebaiknya saya simpan?" -> formal.

QUERY_PENCARIAN: 1-2 kalimat query pasal dengan istilah hukum Indonesia, gabungkan konteks riwayat.
Contoh: "bos saya tidak bayar gaji 3 bulan" -> "pelanggaran kewajiban pembayaran upah pekerja ketenagakerjaan".

PREFERENSI KONSULTASI: isi HANYA kalau disebut di pesan terbaru, selain itu null.
- budget_min/budget_max dalam rupiah per sesi. "di bawah 300rb" -> max 300000; "200-500 ribu" -> 200000 dan
  500000; "minimal 100rb" -> min 100000; "1 juta" -> max 1000000. Jumlah uang dalam cerita kasus (gaji, utang)
  BUKAN budget.
- hari: hari_ini, besok, lusa, minggu_ini, minggu_depan, akhir_pekan, hari_kerja, senin...minggu, atau bebas.
- waktu: pagi, siang, sore, malam, atau bebas ("terserah", "kapan aja").
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
- Kalau ada pasal versi lama dan versi terbaru, pakai versi terbaru. Bagian berlabel penjelasan adalah
  penjelasan resmi, bukan bunyi pasal.
- Kalau konteks pasal kosong atau hanya berkecocokan rendah, katakan terus terang bahwa aturan yang pas
  belum ditemukan di database LangkahLegal, lalu jelaskan secara umum tanpa menyebut nomor pasal.
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
    # Jawaban teks mode ini dibuat dari template (rekomendasi_response), jadi model cukup mengisi tool.
    Mode.REKOMENDASI_KONSULTAN: """MODE TURN INI: REKOMENDASI KONSULTAN
Klien meminta dicarikan advokat atau konsultan. Panggil siapkan_konsultasi dengan kategori yang paling
sesuai, serta kota dan budget kalau klien menyebutnya. Isi ringkasan_kasus HANYA kalau klien sudah
menceritakan kasusnya.""",
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


def tool_mode(mode: Mode) -> ToolMode:
    # Permintaan nasihat dan advokat sudah ditangkap classifier, jadi mode lain tidak perlu menerima deklarasi
    # tool (±350 token per panggilan). Efek sampingnya sejalan dengan guardrail: Kia tidak menyodorkan layanan
    # berbayar kalau klien tidak memintanya.
    if mode in (Mode.ARAHKAN_KONSULTASI, Mode.REKOMENDASI_KONSULTAN):
        return ToolMode.PAKSA
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


def build_system_instruction(mode: Mode, klasifikasi: Klasifikasi, gaya: Gaya) -> str:
    if klasifikasi.intent == Intent.MENOLAK_KONSULTASI:
        mode_prompt = MENOLAK_KONSULTASI_PROMPT
    else:
        mode_prompt = MODE_PROMPTS[mode]

    return "\n\n".join([BASE_PROMPT, mode_prompt, GAYA_PROMPTS[gaya], TEKANAN_PROMPTS[klasifikasi.tekanan]])


def krisis_response(gaya: Gaya) -> str:
    return KRISIS_TEMPLATES[gaya]


KATEGORI_TAMPIL = {
    "Pidana": "hukum pidana",
    "Perdata": "hukum perdata",
    "Ketenagakerjaan": "ketenagakerjaan",
    "Teknologi Informasi": "teknologi informasi",
    "HAM": "hak asasi manusia",
    "Umum": "hukum umum",
}

REKOMENDASI_TEMPLATES = {
    Gaya.FORMAL: {
        "error": "Mohon maaf, pencarian konsultan sedang mengalami kendala. Silakan coba lagi beberapa saat lagi.",
        "kosong": (
            "Mohon maaf, saat ini belum ada konsultan {kategori} yang tersedia di LangkahLegal. Anda dapat "
            "mencari bantuan hukum gratis melalui Lembaga Bantuan Hukum (LBH) setempat atau Pos Bantuan Hukum "
            "(Posbakum) di pengadilan negeri terdekat."
        ),
        "cadangan": (
            "Belum ada konsultan {kategori} yang terverifikasi di LangkahLegal, jadi saya tampilkan konsultan "
            "hukum umum yang dapat membantu."
        ),
        "budget": "Belum ada yang tarifnya sesuai budget {budget}, jadi saya tampilkan tarif yang paling mendekati.",
        "kota": "Belum ada yang berpraktik di {kota}, tetapi konsultasi di LangkahLegal dilakukan lewat video call.",
        "jadwal_cocok": "Slot {waktu} yang masih kosong sudah saya tandai di setiap kartu.",
        "jadwal_sebagian": (
            "Slot {waktu} yang masih kosong sudah saya tandai; untuk yang tidak punya slot itu, saya tampilkan "
            "jadwal terdekatnya."
        ),
        "jadwal_tidak": "Belum ada yang kosong {waktu}, jadi saya tampilkan jadwal terdekat mereka.",
        "ada": "Berikut konsultan {kategori} yang dapat Anda pilih. Klik salah satu slot untuk langsung memesan.",
        "ada_tanpa_slot": 'Berikut konsultan {kategori} yang dapat Anda pilih. Pilih "Jadwalkan" untuk melihat profilnya.',
        "draft": "Ringkasan kasus Anda juga sudah saya siapkan, jadi Anda tidak perlu menulis ulang cerita Anda.",
    },
    Gaya.KASUAL: {
        "error": "Maaf, pencarian konsultan lagi ada kendala. Coba lagi sebentar lagi ya.",
        "kosong": (
            "Maaf, saat ini belum ada konsultan {kategori} yang tersedia di LangkahLegal. Kamu bisa cari bantuan "
            "hukum gratis lewat Lembaga Bantuan Hukum (LBH) setempat atau Pos Bantuan Hukum (Posbakum) di "
            "pengadilan negeri terdekat."
        ),
        "cadangan": (
            "Belum ada konsultan {kategori} yang terverifikasi di LangkahLegal, jadi aku tampilkan konsultan hukum "
            "umum yang bisa bantu."
        ),
        "budget": "Belum ada yang tarifnya masuk budget {budget}, jadi aku tampilkan yang paling mendekati.",
        "kota": "Belum ada yang praktik di {kota}, tapi konsultasi di LangkahLegal lewat video call kok.",
        "jadwal_cocok": "Slot {waktu} yang masih kosong sudah aku tandai di tiap kartu.",
        "jadwal_sebagian": (
            "Slot {waktu} yang masih kosong sudah aku tandai; yang nggak punya slot itu aku tampilkan jadwal "
            "terdekatnya."
        ),
        "jadwal_tidak": "Belum ada yang kosong {waktu}, jadi aku tampilkan jadwal terdekat mereka.",
        "ada": "Ini konsultan {kategori} yang bisa kamu pilih. Klik salah satu slot buat langsung pesan.",
        "ada_tanpa_slot": 'Ini konsultan {kategori} yang bisa kamu pilih. Pilih "Jadwalkan" buat lihat profilnya.',
        "draft": "Ringkasan kasusmu juga sudah aku siapkan, jadi kamu nggak perlu cerita ulang.",
    },
}


def rekomendasi_response(gaya: Gaya, hasil: dict, ada_draft: bool = False) -> str:
    """Jawaban rekomendasi konsultan tanpa memanggil Gemini. Setiap pelonggaran pencarian disampaikan terus terang.

    `hasil` adalah HasilPencarian (lihat services/konsultan_matching) dalam bentuk dict, ditambah "kota" dan
    "error" kalau ada.
    """
    t = REKOMENDASI_TEMPLATES[gaya]
    if hasil.get("error"):
        return t["error"]

    diminta = KATEGORI_TAMPIL.get(hasil.get("kategori_diminta") or hasil.get("kategori"), "hukum")
    konsultan = hasil.get("konsultan") or []
    if not konsultan:
        return t["kosong"].format(kategori=diminta)

    pref = hasil.get("preferensi") or {}
    kalimat = []
    if hasil.get("kategori_cadangan"):
        kalimat.append(t["cadangan"].format(kategori=diminta))
    if hasil.get("budget_dilonggarkan"):
        kalimat.append(
            t["budget"].format(budget=pref_helper.deskripsi_budget(pref.get("budget_min"), pref.get("budget_max")))
        )
    kota = (hasil.get("kota") or "").strip()
    if kota and not any(kota.lower() in (c.get("kota_praktik") or "").lower() for c in konsultan):
        kalimat.append(t["kota"].format(kota=kota))
    waktu = pref_helper.deskripsi_waktu(pref.get("hari"), pref.get("waktu"))
    if hasil.get("jadwal_cocok") is True:
        semua_cocok = all(c.get("jadwal_status") == "cocok" for c in konsultan)
        kalimat.append(t["jadwal_cocok" if semua_cocok else "jadwal_sebagian"].format(waktu=waktu))
    elif hasil.get("jadwal_cocok") is False:
        kalimat.append(t["jadwal_tidak"].format(waktu=waktu))

    ada_slot = any(c.get("slot_cocok") for c in konsultan)
    kategori = KATEGORI_TAMPIL.get(hasil.get("kategori"), "hukum")
    kalimat.append(t["ada" if ada_slot else "ada_tanpa_slot"].format(kategori=kategori))
    if ada_draft:
        kalimat.append(t["draft"])
    return " ".join(kalimat)


TANYA_PREFERENSI_TEMPLATES = {
    Gaya.FORMAL: {
        "kategori": "Dari cerita Anda, persoalan ini termasuk {kategori} (bisa Anda ubah di bawah). ",
        "tanya": (
            "Supaya rekomendasinya pas, silakan isi kisaran budget per sesi dan waktu konsultasi yang Anda "
            'inginkan. Kalau ingin melihat semua konsultan dulu, pilih "Lewati".'
        ),
    },
    Gaya.KASUAL: {
        "kategori": "Dari ceritamu, ini termasuk {kategori} (bisa kamu ubah di bawah). ",
        "tanya": (
            "Supaya rekomendasinya pas, isi kisaran budget per sesi dan waktu yang kamu bisa ya. Kalau mau lihat "
            'semua konsultan dulu, pilih "Lewati".'
        ),
    },
}


def tanya_preferensi_response(gaya: Gaya, kategori: Optional[str]) -> str:
    t = TANYA_PREFERENSI_TEMPLATES[gaya]
    awal = t["kategori"].format(kategori=KATEGORI_TAMPIL[kategori]) if kategori in KATEGORI_TAMPIL else ""
    return awal + t["tanya"]


def form_preferensi(kategori: Optional[str], nilai_awal: Optional[dict] = None) -> dict:
    """Isi form preferensi yang ditampilkan frontend di bawah pertanyaan Kia."""
    return {
        "kategori": kategori if kategori in KATEGORI_TAMPIL else "Umum",
        "pilihan_kategori": [{"nilai": k, "label": v.capitalize()} for k, v in KATEGORI_TAMPIL.items()],
        "pilihan_hari": [{"nilai": k, "label": v} for k, v in pref_helper.PILIHAN_HARI.items()],
        "pilihan_waktu": [{"nilai": k, "label": v[0]} for k, v in pref_helper.PILIHAN_WAKTU.items()],
        "nilai_awal": nilai_awal or {},
    }


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
        elif meta_type == "tanya_preferensi":
            content += " [Kia menanyakan budget dan jadwal konsultasi]"
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
    if model_name.startswith("gemini-3.8"):
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
            logger.warning(f"[CLASSIFY] {model_name} gagal: {gemini_errors.describe(e)}")
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
