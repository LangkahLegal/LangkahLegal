"""Mengenali bagian Penjelasan dan potongan "Cukup jelas" pada dokumen peraturan yang sudah dipotong per pasal.

Naskah UU terdiri dari batang tubuh (bunyi pasal) lalu Penjelasan, yang membahas ulang pasal-pasal dengan nomor
yang sama. Pemotong per pasal tidak membedakan keduanya, sehingga "Pasal 13" bisa muncul dua kali dan isi
penjelasan bisa terkutip seolah bunyi pasal.
"""

import re

# Judul bagian Penjelasan selalu huruf kapital; frasa "penjelasan atas" huruf kecil bisa muncul di kalimat biasa.
MARKER_PENJELASAN = re.compile(r"PENJELASAN\s+ATAS|PASAL\s+DEMI\s+PASAL")
_CIRI = re.compile(
    r"^(cukup jelas|yang dimaksud|ayat\s*\(|huruf\s+\w|angka\s+\d|ketentuan ini|pasal ini|istilah)", re.I
)
_HEADER = re.compile(r"^(?:BAB [^\n]*? - )?Pasal\s+\S+\s*\n?", re.I)
_LABEL = re.compile(r"^(?:ayat\s*\(\w+\)|huruf\s+\w+|angka\s+\d+\w*|pasal\s+\d+\w*|cukup\s+jelas\.*)$", re.I)
_NOMOR = re.compile(r"Pasal\s+(\d+)", re.I)

MIN_NOMOR_SEBELUM_RESET = 10
MIN_PORSI_BERCIRI = 0.5


def isi_tanpa_judul(teks: str) -> str:
    """Isi chunk tanpa judul "BAB ... - Pasal N" atau "Pasal N" di baris pertama."""
    return _HEADER.sub("", teks.strip(), count=1).strip()


def nomor_pasal(label: str) -> int | None:
    m = _NOMOR.match(label or "")
    return int(m.group(1)) if m else None


def berciri_penjelasan(teks: str) -> bool:
    return bool(_CIRI.match(isi_tanpa_judul(teks)))


def hanya_cukup_jelas(teks: str) -> bool:
    """True kalau isinya cuma "Cukup jelas" plus label ayat/huruf, atau label tanpa isi sama sekali."""
    # Titik-titik di ujung baris ("Pasal 52 . . .") adalah penanda sambungan halaman di naskah JDIH BPK.
    baris = [re.sub(r"[\s.]+$", "", b.strip()) for b in isi_tanpa_judul(teks).splitlines()]
    # Baris huruf kapital semua biasanya sisa kop halaman ("REPUBLIK INDONESIA"), bukan isi.
    baris = [b for b in baris if b and not (b.isupper() and len(b) <= 40)]
    if not baris:
        return True
    if not all(_LABEL.match(b) for b in baris):
        return False
    return any("cukup jelas" in b.lower() for b in baris) or sum(map(len, baris)) < 20


def awal_penjelasan(chunks: list[tuple[str, str]]) -> int | None:
    """Index chunk pertama bagian Penjelasan dari daftar (label pasal, teks) yang urut sesuai naskah.

    Dua cara, dipilih yang paling awal:
    1. Ada judul "PENJELASAN ATAS ..." / "PASAL DEMI PASAL": chunk sesudahnya adalah penjelasan.
    2. Nomor pasal kembali ke awal (misalnya dari Pasal 193 ke Pasal 1) dan setidaknya separuh chunk sesudahnya
       berciri penjelasan ("Cukup jelas", "Yang dimaksud dengan", "Ayat (1)").
    """
    kandidat = []
    for i, (_, teks) in enumerate(chunks):
        if MARKER_PENJELASAN.search(teks):
            kandidat.append(i + 1)
            break

    tertinggi = 0
    for i, (label, _) in enumerate(chunks):
        n = nomor_pasal(label)
        if n is None:
            continue
        if tertinggi >= MIN_NOMOR_SEBELUM_RESET and n <= 3 and n < tertinggi / 3:
            sesudah = chunks[i:]
            if sum(berciri_penjelasan(t) for _, t in sesudah) / len(sesudah) >= MIN_PORSI_BERCIRI:
                kandidat.append(i)
                break
        tertinggi = max(tertinggi, n)

    awal = min(kandidat) if kandidat else None
    return awal if awal is not None and awal < len(chunks) else None


def label_penjelasan(label: str) -> str:
    """'Pasal 13' atau 'Pasal 13_2' menjadi 'Penjelasan Pasal 13'."""
    m = re.match(r"Pasal\s+(\S+?)(?:_\d+)?$", label or "")
    return f"Penjelasan Pasal {m.group(1)}" if m else f"Penjelasan {label}".strip()
