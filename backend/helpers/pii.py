"""Menyamarkan data pribadi klien sebelum teks dikirim ke Gemini atau Voyage.

Data pribadi diganti placeholder seperti [NAMA_1] atau [TELEPON_1], lalu placeholder di jawaban model
dikembalikan ke nilai aslinya. Satu Penyamar dipakai untuk satu request: nilai yang sama selalu mendapat
placeholder yang sama, jadi model tetap bisa mengikuti siapa yang dibicarakan di sepanjang riwayat.

Nominal uang, nomor peraturan/pasal, dan tanggal sengaja tidak disentuh karena dipakai classifier
(budget) dan pencarian pasal. Semua pola angka minimal 8 digit, jadi "UU 13/2003" dan "Pasal 1365" aman.
"""

import re
from collections import Counter

_EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")
_KARTU = re.compile(r"(?<!\d)\d{4}(?:[ -]\d{4}){2}[ -]\d{1,7}(?!\d)")
_NIK = re.compile(r"(?<!\d)\d{16}(?!\d)")
_TELEPON = re.compile(r"(?<![\w+])(?:\+62[ -]?|62|0)8\d{1,3}[ -]?\d{3,4}[ -]?\d{2,5}(?!\d)")
_REKENING = re.compile(
    r"(?i:\b(?:no(?:mor)?\.?\s*)?(?:rek(?:ening)?|norek|a/c|va|virtual account)\b\.?\s*:?\s*)"
    r"(?:[A-Z][A-Za-z]{1,9}\s+)?(\d[\d -]{6,22}\d)(?!\d)"
)
# Nomor panjang lain (BPJS, polis, nomor perkara berupa angka). "Rp1000000000" tetap dibiarkan.
_NOMOR = re.compile(r"(?<![\d.,])(?<![Rr]p)(?<![Rr]p )\d{10,}(?![\d.,])")
_PLAT = re.compile(r"\b(?!UU\b|PP\b|NO\b)([A-Z]{1,2} \d{1,4} [A-Z]{1,3})\b")
_ALAMAT = re.compile(
    r"(?:\b(?i:jln?|gg)\.\s*|\b(?:Jalan|Gang)\s+)[A-Za-z0-9][\w.'-]*(?:\s+[A-Z0-9][\w.'-]*){0,3}"
    r"(?:\s*,?\s*(?i:no)\.?\s*\d+[A-Za-z]?)?"
)

# Nama hanya dikenali kalau ada penandanya. Penanda kuat ("nama saya") menerima huruf kecil, sapaan
# ("pak", "Bu") hanya menerima nama berhuruf kapital supaya "pak polisi" atau "bu guru" tidak ikut.
_PENANDA_KUAT = re.compile(
    r"(?i:\b(?:nama\s+(?:saya|aku|gue|gw|ku)|saya\s+bernama|aku\s+bernama|atas\s+nama|a\.n\.)\s*:?\s+)"
)
_SAPAAN = re.compile(r"\b(?:(?i:pak|bapak|bu|ibu|saudara|saudari|mas|mbak|kak|bang|tuan|nyonya)|Sdri?\.?)\s+")
_KATA = re.compile(r"[A-Za-z][A-Za-z'.-]*")

BUKAN_NAMA = set(
    # jabatan dan peran yang sering ditulis setelah sapaan
    "rt rw lurah camat bupati walikota gubernur presiden menteri kades kepala ketua hakim jaksa polisi pengacara "
    "advokat notaris dokter bidan guru dosen direktur manajer manager atasan bos hrd supervisor mandor satpam kos "
    "kost haji hajjah ustadz ustad pendeta kota negara pejabat pemilik majikan owner kepsek lurahnya camatnya "
    # kata ganti dan kata umum
    "anda kamu saya aku kami kita dia beliau mereka itu ini yang sudah belum tidak bisa dan atau juga tolong mohon "
    "terima kasih".split()
)
# Kata yang menghentikan pengambilan nama setelah penanda kuat, misalnya "nama saya budi dan saya ...".
_KATA_HENTI = BUKAN_NAMA | set(
    "di ke dari pada dengan untuk karena sejak tapi tetapi lalu umur usia tinggal bekerja kerja mau ingin minta "
    "punya adalah selaku sebagai pak bu bapak ibu sdr".split()
)
MAKS_KATA_NAMA = 3

# Urutan penting: pola yang lebih spesifik dulu. Rekening dikenali dari kata kuncinya, jadi didahulukan
# supaya VA 16 digit tidak terbaca sebagai NIK, dan nomor kartu tidak terbaca sebagai telepon.
POLA = (
    ("EMAIL", _EMAIL),
    ("REKENING", _REKENING),
    ("KARTU", _KARTU),
    ("NIK", _NIK),
    ("TELEPON", _TELEPON),
    ("NOMOR", _NOMOR),
    ("PLAT", _PLAT),
    ("ALAMAT", _ALAMAT),
)
JENIS = tuple(jenis for jenis, _ in POLA) + ("NAMA",)
_PLACEHOLDER = re.compile(r"\[?\b(" + "|".join(JENIS) + r")_(\d+)\b\]?")


def _ambil_nama(teks: str, mulai: int, harus_kapital: bool) -> str:
    """Ambil sampai 3 kata nama setelah penanda. Nama berhuruf kecil ("nama saya budi santoso") dibatasi
    2 kata, karena tanpa huruf kapital batas akhir nama tidak kelihatan."""
    kata = []
    for m in _KATA.finditer(teks, mulai):
        if teks[mulai : m.start()].strip():
            break  # ada tanda baca di antara kata
        w = m.group().rstrip(".")
        if not kata:
            harus_kapital = harus_kapital or w[0].isupper()
        # w in JENIS: placeholder yang ditulis model tanpa kurung ("Pak NAMA_1") bukan nama baru.
        if w in JENIS or w.lower() in _KATA_HENTI or (harus_kapital and not w[0].isupper()):
            break
        kata.append(w)
        mulai = m.end()
        if len(kata) == (MAKS_KATA_NAMA if harus_kapital else 2):
            break
    return " ".join(kata)


def kenali_nama(teks: str) -> list[str]:
    nama = []
    for penanda, harus_kapital in ((_PENANDA_KUAT, False), (_SAPAAN, True)):
        for m in penanda.finditer(teks):
            calon = _ambil_nama(teks, m.end(), harus_kapital)
            if calon and len(calon) >= 3:
                nama.append(calon)
    return nama


class Penyamar:
    def __init__(self) -> None:
        self._asli: dict[str, str] = {}  # "[NAMA_1]" -> "Budi Santoso"
        self._placeholder: dict[tuple[str, str], str] = {}  # ("NAMA", "budi santoso") -> "[NAMA_1]"
        self._jumlah: Counter = Counter()
        self._nama: list[str] = []

    def _ganti(self, jenis: str, nilai: str) -> str:
        kunci = (jenis, nilai.lower() if jenis == "NAMA" else re.sub(r"[ -]", "", nilai))
        if kunci not in self._placeholder:
            self._jumlah[jenis] += 1
            placeholder = f"[{jenis}_{self._jumlah[jenis]}]"
            self._placeholder[kunci] = placeholder
            self._asli[placeholder] = nilai
        return self._placeholder[kunci]

    def _daftarkan_nama(self, teks: str) -> None:
        for nama in kenali_nama(teks):
            # Nama lengkap dan tiap katanya ikut didaftarkan, supaya "Budi" yang disebut ulang tanpa
            # sapaan juga tersamar.
            for calon in [nama, *nama.split()]:
                if len(calon) >= 3 and calon.lower() not in BUKAN_NAMA and calon.lower() not in self._nama:
                    self._nama.append(calon.lower())
        self._nama.sort(key=len, reverse=True)

    def _samarkan_pola(self, teks: str) -> str:
        for jenis, pola in POLA:
            if pola.groups:
                teks = pola.sub(lambda m, j=jenis: m.group(0).replace(m.group(1), self._ganti(j, m.group(1))), teks)
            else:
                teks = pola.sub(lambda m, j=jenis: self._ganti(j, m.group(0)), teks)
        for nama in self._nama:
            teks = re.sub(
                rf"(?<![\w\[]){re.escape(nama)}(?!\w)", lambda m: self._ganti("NAMA", m.group(0)), teks, flags=re.I
            )
        return teks

    def samarkan(self, teks: str) -> str:
        if not teks:
            return teks
        self._daftarkan_nama(teks)
        return self._samarkan_pola(teks)

    def samarkan_percakapan(self, query: str, history: list[dict]) -> tuple[str, list[dict]]:
        """Samarkan query dan salinan riwayat. Nama dikumpulkan dari semua pesan dulu, supaya nama yang baru
        diperkenalkan di pesan terakhir juga tersamar di pesan-pesan sebelumnya. Metadata tidak diubah."""
        for msg in history:
            self._daftarkan_nama(msg.get("content") or "")
        self._daftarkan_nama(query or "")
        riwayat = [{**msg, "content": self._samarkan_pola(msg.get("content") or "")} for msg in history]
        return self._samarkan_pola(query or ""), riwayat

    def pulihkan(self, obj):
        if isinstance(obj, str):
            return _PLACEHOLDER.sub(lambda m: self._asli.get(f"[{m.group(1)}_{m.group(2)}]", m.group(0)), obj)
        if isinstance(obj, list):
            return [self.pulihkan(v) for v in obj]
        if isinstance(obj, dict):
            return {k: self.pulihkan(v) for k, v in obj.items()}
        return obj

    def ringkasan(self) -> dict[str, int]:
        """Jumlah data pribadi per jenis, tanpa nilainya. Aman untuk log."""
        return dict(self._jumlah)
