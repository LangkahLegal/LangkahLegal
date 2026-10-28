"""Eval ekstraksi preferensi konsultasi (budget, hari, waktu) oleh classifier, terhadap Gemini sungguhan.

Jalankan manual dari folder backend:

    python -m evals.preferensi_eval

Yang dicek: intent, budget_min, budget_max, hari, dan waktu hasil classifier untuk pesan yang menyebut (atau
tidak menyebut) preferensi. Jumlah uang dalam cerita kasus (gaji, utang) tidak boleh terbaca sebagai budget.
"""

import sys
import time

from services import chat_policy, rag_service

JEDA_DETIK = 5
TANYA = {
    "role": "ai",
    "content": "Supaya rekomendasinya pas, isi kisaran budget per sesi dan waktu yang kamu bisa ya.",
    "metadata": {"type": "tanya_preferensi"},
}
RIWAYAT_TANYA = [{"role": "user", "content": "tolong carikan pengacara ketenagakerjaan"}, TANYA]

# (pesan, riwayat, intent yang diterima, preferensi yang diharapkan persis)
KASUS = [
    ("Tolong carikan pengacara ketenagakerjaan di bawah 300 ribu", [], {"minta_konsultan"}, {"budget_max": 300000}),
    ("kak cariin pengacara yang bisa sabtu pagi dong", [], {"minta_konsultan"}, {"hari": "sabtu", "waktu": "pagi"}),
    (
        "Saya butuh advokat, budget 200-500 ribu, bisanya malam hari kerja",
        [],
        {"minta_konsultan"},
        {"budget_min": 200000, "budget_max": 500000, "hari": "hari_kerja", "waktu": "malam"},
    ),
    ("200rb, sabtu pagi", RIWAYAT_TANYA, {"minta_konsultan"}, {"budget_max": 200000, "hari": "sabtu", "waktu": "pagi"}),
    ("terserah kak, kapan aja bisa", RIWAYAT_TANYA, {"minta_konsultan"}, {"hari": "bebas", "waktu": "bebas"}),
    (
        "maksimal 1 juta, besok sore",
        RIWAYAT_TANYA,
        {"minta_konsultan"},
        {"budget_max": 1000000, "hari": "besok", "waktu": "sore"},
    ),
    (
        "minimal 150rb ya, akhir pekan",
        RIWAYAT_TANYA,
        {"minta_konsultan"},
        {"budget_min": 150000, "hari": "akhir_pekan"},
    ),
    # Uang dalam cerita kasus bukan budget
    ("Gaji saya 5 juta sebulan tapi sudah 3 bulan tidak dibayar kantor", [], {"cerita_masalah", "tanya_aturan"}, {}),
    ("Saya punya utang 20 juta ke teman, sekarang ditagih terus", [], {"cerita_masalah", "tanya_aturan"}, {}),
    ("Apa sanksi pengusaha yang tidak membayar upah?", [], {"tanya_aturan"}, {}),
    ("tolong carikan pengacara", [], {"minta_konsultan"}, {}),
]


def main() -> int:
    client = rag_service._get_gemini_client()
    gagal = 0
    print(f"=== PREFERENSI ({len(KASUS)} kasus) ===")
    for i, (pesan, riwayat, intents, harapan) in enumerate(KASUS, 1):
        if i > 1:
            time.sleep(JEDA_DETIK)
        hasil = chat_policy.classify(client, pesan, riwayat)
        if hasil is None:
            gagal += 1
            print(f"[{i:02}] ERROR  classifier gagal | {pesan[:60]}")
            continue
        pref = hasil.preferensi()
        salah = []
        if hasil.intent.value not in intents:
            salah.append(f"intent={hasil.intent.value} (harusnya {sorted(intents)})")
        if pref != harapan:
            salah.append(f"preferensi={pref} (harusnya {harapan})")
        gagal += bool(salah)
        status = "SALAH " if salah else "OK    "
        print(f"[{i:02}] {status} {hasil.intent.value}/{pref} | {pesan[:60]}")
        if salah:
            print(f"       {'; '.join(salah)}")
    print(f"Preferensi: {len(KASUS) - gagal}/{len(KASUS)} benar")
    return 1 if gagal else 0


if __name__ == "__main__":
    sys.exit(main())
