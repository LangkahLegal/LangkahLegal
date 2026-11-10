"""Eval penyamaran data pribadi (helpers/pii.py). Offline, tidak memanggil Gemini atau Voyage.

Jalankan dari folder backend:

    python -m evals.pii_eval

Yang dicek: data pribadi tersamar, teks yang dipakai classifier dan pencarian pasal (nominal uang, nomor
peraturan, pasal, tanggal) tetap utuh, dan pulihkan(samarkan(x)) mengembalikan teks aslinya.
"""

import sys

from helpers.pii import Penyamar

# (teks, potongan yang harus hilang dari hasil samaran)
TERSAMAR = [
    ("NIK saya 3273010101900001, tolong dicek", ["3273010101900001"]),
    ("Hubungi saya di 0812-3456-7890 ya", ["0812-3456-7890"]),
    ("nomor wa aku +62 812 3456 7890", ["812 3456 7890"]),
    ("hp: 6281234567890", ["6281234567890"]),
    ("Email saya budi.santoso@gmail.com", ["budi.santoso@gmail.com"]),
    ("Gaji ditransfer ke rekening BCA 1234567890 tapi belum masuk", ["1234567890"]),
    ("no. rek 123-456-7890 atas nama ibu saya", ["123-456-7890"]),
    ("Kartu kredit 4111 1111 1111 1111 saya dibobol", ["4111 1111 1111 1111"]),
    ("Nomor BPJS 0001234567890 tidak aktif", ["0001234567890"]),
    ("Motor saya plat D 1234 ABC dicuri", ["D 1234 ABC"]),
    ("Saya tinggal di Jl. Dipatiukur No. 35, Bandung", ["Dipatiukur"]),
    ("Rumah di Jalan Merdeka Raya No 12 digusur", ["Merdeka Raya"]),
    ("nama saya budi santoso, saya karyawan kontrak", ["budi", "santoso"]),
    ("Nama saya Siti Nurhaliza Putri dan saya dipecat", ["Siti", "Nurhaliza", "Putri"]),
    ("Atasan saya Pak Ahmad Fauzi tidak membayar gaji. Ahmad bilang nanti", ["Ahmad", "Fauzi"]),
    ("Tetangga saya bu Rina sering mengancam", ["Rina"]),
    ("Surat itu atas nama Dewi Lestari", ["Dewi", "Lestari"]),
]

# Teks yang harus tetap utuh persis
UTUH = [
    "Apa isi UU 13/2003 tentang upah?",
    "Pasal 1365 KUHPerdata soal perbuatan melawan hukum",
    "UU Nomor 11 Tahun 2008 tentang ITE",
    "PP 35 Tahun 2021 mengatur PKWT",
    "Budget saya di bawah Rp300rb, kalau bisa 200-500 ribu",
    "Gaji saya Rp5.000.000 sebulan, total utang Rp1000000000",
    "Bisanya sabtu 15 November 2026 jam 08.00",
    "Saya sudah lapor ke Pak RT dan bu Lurah",
    "Pak Polisi bilang harus ada bukti",
    "Bapak/Ibu dapat menyiapkan bukti transfer gaji.",
    "Ibu Kota Nusantara",
    "Bagaimana kalau Bapak Anda tidak setuju?",
    "saya jalan kaki ke kantor",
    "Kemarin bos saya marah, pak. Saya takut",
]


def _cek_tersamar(gagal: list[str]) -> None:
    for teks, harus_hilang in TERSAMAR:
        p = Penyamar()
        samaran = p.samarkan(teks)
        bocor = [s for s in harus_hilang if s.lower() in samaran.lower()]
        if bocor:
            gagal.append(f"BOCOR  {bocor} | {samaran}")
        if p.pulihkan(samaran) != teks:
            gagal.append(f"PULIH  {p.pulihkan(samaran)!r} != {teks!r}")


def _cek_utuh(gagal: list[str]) -> None:
    for teks in UTUH:
        samaran = Penyamar().samarkan(teks)
        if samaran != teks:
            gagal.append(f"BERUBAH {teks!r} -> {samaran!r}")


def _cek_percakapan(gagal: list[str]) -> None:
    p = Penyamar()
    riwayat = [
        {"role": "user", "content": "Budi sudah 3 bulan tidak digaji", "metadata": None},
        {"role": "ai", "content": "Baik, sejak kapan Budi bekerja di sana?", "metadata": {"type": "text"}},
    ]
    # Nama baru diperkenalkan di pesan terakhir, tapi riwayat sebelumnya juga harus ikut tersamar.
    query, hasil = p.samarkan_percakapan("Nama saya Budi Hartono, HP 081298765432", riwayat)
    gabungan = query + " ".join(m["content"] for m in hasil)
    if "Budi" in gabungan or "081298765432" in gabungan:
        gagal.append(f"PERCAKAPAN bocor: {query} | {[m['content'] for m in hasil]}")
    if hasil[1]["metadata"] != {"type": "text"} or riwayat[0]["content"] != "Budi sudah 3 bulan tidak digaji":
        gagal.append("PERCAKAPAN metadata berubah atau riwayat asli ikut terubah")

    # Model kadang membuang kurung siku placeholder.
    jawaban = "Saya NAMA_2 dengan nomor [TELEPON_1], kasus [NAMA_1] dan [NAMA_9]"
    pulih = p.pulihkan({"jawaban": jawaban, "bukti": ["chat dengan [NAMA_1]"], "angka": 3})
    if "TELEPON" in pulih["jawaban"] or "[NAMA_1]" in pulih["bukti"][0] or "[NAMA_9]" not in pulih["jawaban"]:
        gagal.append(f"PULIHKAN salah: {pulih}")
    if set(p.ringkasan()) != {"NAMA", "TELEPON"}:
        gagal.append(f"RINGKASAN salah: {p.ringkasan()}")

    # Placeholder tanpa kurung di jawaban model tidak boleh terdaftar sebagai nama baru.
    samaran = p.samarkan("Pak NAMA_1, slip gaji atas nama Budi")
    if samaran != "Pak NAMA_1, slip gaji atas nama [NAMA_1]":
        gagal.append(f"PLACEHOLDER dianggap nama: {samaran}")


def main() -> int:
    gagal: list[str] = []
    _cek_tersamar(gagal)
    _cek_utuh(gagal)
    _cek_percakapan(gagal)
    total = len(TERSAMAR) * 2 + len(UTUH) + 5
    for g in gagal:
        print(g)
    print(f"PII: {total - len(gagal)}/{total} cek lolos")
    return 1 if gagal else 0


if __name__ == "__main__":
    sys.exit(main())
