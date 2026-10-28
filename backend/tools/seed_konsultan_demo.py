"""Seed konsultan demo untuk menguji rekomendasi konsultan oleh chatbot. Jalankan manual dari folder backend:

    python tools/seed_konsultan_demo.py --dry-run     # lihat profil dan jadwal yang akan dibuat
    python tools/seed_konsultan_demo.py               # buat/perbarui akun, profil, dan jadwal
    python tools/seed_konsultan_demo.py --hapus       # hapus semua akun demo beserta jadwalnya

Profilnya fiktif (bukan orang sungguhan) tetapi dibuat selengkap profil asli. Variasinya sengaja disusun untuk
menguji: kategori hukum, rentang tarif, kota, pola jadwal (pagi/siang/malam/akhir pekan/jarang/tanpa jadwal),
serta dua akun kontrol yang TIDAK boleh direkomendasikan (belum terverifikasi dan nonaktif).

Jadwal dibuat berulang per minggu untuk MINGGU_JADWAL minggu ke depan. Menjalankan ulang script hanya menambah
tanggal yang belum ada, jadi aman dipakai untuk memperpanjang jadwal tanpa menyentuh slot yang sudah dipesan.
Akun demo dikenali dari awalan email EMAIL_PREFIX.
"""

import argparse
import os
import secrets
import sys
from datetime import date, timedelta
from pathlib import Path

import httpx

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from core.database import get_supabase_client  # noqa: E402

EMAIL_PREFIX = "demo.konsultan."
EMAIL_DOMAIN = "example.com"
MINGGU_JADWAL = 6

SEN, SEL, RAB, KAM, JUM, SAB, MIN = range(7)
HARI_KERJA = (SEN, SEL, RAB, KAM, JUM)

# Setiap profil: data tabel konsultan + pola jadwal mingguan {hari: [(jam_mulai, jam_selesai), ...]}.
PROFIL = [
    {
        "slug": "rina.kartikasari",
        "nama_lengkap": "Rina Kartikasari, S.H., M.H.",
        "gelar_akademik": "S.H., M.H.",
        "pendidikan_terakhir": "S2 Ilmu Hukum, Universitas Padjadjaran",
        "spesialisasi": "Ketenagakerjaan",
        "kota_praktik": "Bandung",
        "pengalaman_tahun": 8,
        "tarif_per_sesi": 150000,
        "bio_singkat": "Advokat ketenagakerjaan yang banyak mendampingi pekerja kontrak dan korban PHK sepihak.",
        "deskripsi_lengkap": (
            "Berpraktik sejak 2018 dengan fokus perselisihan hubungan industrial: PKWT yang diperpanjang terus, "
            "upah yang tidak dibayar, PHK sepihak, dan hak pesangon. Terbiasa mendampingi perundingan bipartit, "
            "mediasi di Disnaker, hingga gugatan di Pengadilan Hubungan Industrial Bandung. Menjelaskan hak "
            "pekerja dengan bahasa sederhana dan membantu menyusun kronologi serta bukti sebelum langkah hukum."
        ),
        "jadwal": {h: [("19:00", "21:00")] for h in HARI_KERJA},
    },
    {
        "slug": "bayu.prasetyo",
        "nama_lengkap": "Bayu Prasetyo Nugroho, S.H.",
        "gelar_akademik": "S.H.",
        "pendidikan_terakhir": "S1 Ilmu Hukum, Universitas Indonesia",
        "spesialisasi": "Ketenagakerjaan",
        "kota_praktik": "Jakarta Selatan",
        "pengalaman_tahun": 5,
        "tarif_per_sesi": 250000,
        "bio_singkat": "Konsultan hukum ketenagakerjaan untuk karyawan swasta dan startup, khusus akhir pekan.",
        "deskripsi_lengkap": (
            "Menangani konsultasi kontrak kerja, perjanjian kerahasiaan, larangan bersaing, hak cuti, lembur, "
            "dan BPJS Ketenagakerjaan. Banyak membantu karyawan yang hanya punya waktu di akhir pekan. Sebelum "
            "menjadi advokat bekerja di bagian legal sebuah perusahaan teknologi di Jakarta."
        ),
        "jadwal": {SAB: [("09:00", "15:00")], MIN: [("09:00", "15:00")]},
    },
    {
        "slug": "hendra.siregar",
        "nama_lengkap": "Dr. Hendra Wirawan Siregar, S.H., M.Hum.",
        "gelar_akademik": "Dr., S.H., M.Hum.",
        "pendidikan_terakhir": "S3 Ilmu Hukum, Universitas Sumatera Utara",
        "spesialisasi": "Ketenagakerjaan",
        "kota_praktik": "Jakarta Pusat",
        "pengalaman_tahun": 17,
        "tarif_per_sesi": 750000,
        "bio_singkat": "Advokat senior hubungan industrial, berpengalaman di PHI dan kasasi Mahkamah Agung.",
        "deskripsi_lengkap": (
            "Tujuh belas tahun menangani perkara ketenagakerjaan bernilai besar: PHK massal, efisiensi "
            "perusahaan, kepailitan pemberi kerja, dan sengketa pesangon hingga tingkat kasasi. Juga mengajar "
            "hukum ketenagakerjaan sebagai dosen tamu. Jadwal konsultasi terbatas pada pagi hari kerja tertentu."
        ),
        "jadwal": {SEL: [("08:00", "11:00")], KAM: [("08:00", "11:00")]},
    },
    {
        "slug": "dimas.wicaksono",
        "nama_lengkap": "Dimas Aryo Wicaksono, S.H., M.H.",
        "gelar_akademik": "S.H., M.H.",
        "pendidikan_terakhir": "S2 Ilmu Hukum, Universitas Airlangga",
        "spesialisasi": "Pidana",
        "kota_praktik": "Surabaya",
        "pengalaman_tahun": 10,
        "tarif_per_sesi": 200000,
        "bio_singkat": "Advokat pidana umum: penipuan, penggelapan, penganiayaan, dan pendampingan pemeriksaan polisi.",
        "deskripsi_lengkap": (
            "Mendampingi pelapor maupun terlapor sejak tahap penyelidikan, BAP di kepolisian, hingga persidangan. "
            "Berpengalaman dengan perkara penipuan jual beli online, penggelapan, dan penganiayaan, serta "
            "upaya restorative justice. Sudah menyesuaikan pendampingan dengan KUHP baru (UU 1/2023)."
        ),
        "jadwal": {h: [("09:00", "16:00")] for h in HARI_KERJA},
    },
    {
        "slug": "natalia.simanjuntak",
        "nama_lengkap": "Natalia Simanjuntak, S.H., LL.M.",
        "gelar_akademik": "S.H., LL.M.",
        "pendidikan_terakhir": "LL.M. Criminal Justice, Universiteit Leiden",
        "spesialisasi": "Pidana",
        "kota_praktik": "Jakarta Barat",
        "pengalaman_tahun": 12,
        "tarif_per_sesi": 500000,
        "bio_singkat": "Advokat pidana dengan fokus tindak pidana korupsi, pencucian uang, dan kejahatan korporasi.",
        "deskripsi_lengkap": (
            "Menangani perkara tindak pidana korupsi, TPPU, dan pidana korporasi, termasuk pendampingan saksi "
            "di KPK dan Kejaksaan. Lulusan LL.M. Universiteit Leiden. Membuka konsultasi malam di hari kerja "
            "tertentu dan Sabtu pagi."
        ),
        "jadwal": {SEN: [("18:00", "21:00")], RAB: [("18:00", "21:00")], SAB: [("10:00", "13:00")]},
    },
    {
        "slug": "sri.wahyuningsih",
        "nama_lengkap": "Sri Wahyuningsih, S.H., M.Kn.",
        "gelar_akademik": "S.H., M.Kn.",
        "pendidikan_terakhir": "S2 Kenotariatan, Universitas Gadjah Mada",
        "spesialisasi": "Perdata",
        "kota_praktik": "Yogyakarta",
        "pengalaman_tahun": 14,
        "tarif_per_sesi": 175000,
        "bio_singkat": "Konsultan hukum keluarga, waris, dan pertanahan: perceraian, harta gono-gini, sertifikat tanah.",
        "deskripsi_lengkap": (
            "Berpengalaman di perkara perceraian dan pembagian harta bersama, waris, hibah, serta sengketa "
            "sertifikat tanah dan PTSL. Latar belakang kenotariatan membantu klien memahami akta dan dokumen "
            "pertanahan. Konsultasi pagi hari Senin, Rabu, dan Jumat."
        ),
        "jadwal": {SEN: [("08:00", "12:00")], RAB: [("08:00", "12:00")], JUM: [("08:00", "12:00")]},
    },
    {
        "slug": "fajar.nugraha",
        "nama_lengkap": "Fajar Nugraha Putra, S.H.",
        "gelar_akademik": "S.H.",
        "pendidikan_terakhir": "S1 Ilmu Hukum, Universitas Katolik Parahyangan",
        "spesialisasi": "Perdata",
        "kota_praktik": "Bandung",
        "pengalaman_tahun": 4,
        "tarif_per_sesi": 350000,
        "bio_singkat": "Advokat perdata bisnis: perjanjian, sewa-menyewa, utang piutang, dan wanprestasi.",
        "deskripsi_lengkap": (
            "Membantu UMKM dan perorangan menyusun serta meninjau perjanjian, menagih utang piutang, dan "
            "menyelesaikan wanprestasi lewat somasi, mediasi, atau gugatan sederhana. Terbiasa dengan "
            "e-Court Mahkamah Agung. Konsultasi siang hari Senin sampai Sabtu."
        ),
        "jadwal": {h: [("13:00", "17:00")] for h in (*HARI_KERJA, SAB)},
    },
    {
        "slug": "ayu.paramita",
        "nama_lengkap": "Ayu Lestari Paramita, S.H.",
        "gelar_akademik": "S.H.",
        "pendidikan_terakhir": "S1 Ilmu Hukum, Universitas Padjadjaran",
        "spesialisasi": "HAM",
        "kota_praktik": "Bandung",
        "pengalaman_tahun": 7,
        "tarif_per_sesi": 75000,
        "bio_singkat": "Pendamping hukum korban KDRT dan kekerasan seksual, dengan tarif sosial.",
        "deskripsi_lengkap": (
            "Tujuh tahun mendampingi korban KDRT dan kekerasan seksual, termasuk pelaporan berdasarkan UU TPKS, "
            "permohonan perlindungan, dan restitusi. Bekerja sama dengan layanan pengaduan dan psikolog. "
            "Menerapkan pendekatan yang berpusat pada korban dan menjaga kerahasiaan."
        ),
        "jadwal": {**{h: [("10:00", "14:00")] for h in HARI_KERJA}, SAB: [("09:00", "12:00")]},
    },
    {
        "slug": "maria.tambunan",
        "nama_lengkap": "Maria Goretti Tambunan, S.H., M.H.",
        "gelar_akademik": "S.H., M.H.",
        "pendidikan_terakhir": "S2 Ilmu Hukum, Universitas Katolik Indonesia Atma Jaya",
        "spesialisasi": "HAM",
        "kota_praktik": "Jakarta Timur",
        "pengalaman_tahun": 11,
        "tarif_per_sesi": 300000,
        "bio_singkat": "Advokat hak asasi manusia: diskriminasi, perlindungan anak, dan perdagangan orang.",
        "deskripsi_lengkap": (
            "Menangani perkara diskriminasi di tempat kerja dan layanan publik, perlindungan anak, serta "
            "tindak pidana perdagangan orang. Pernah aktif di lembaga bantuan hukum sebelum membuka praktik "
            "sendiri. Konsultasi malam hari Selasa dan Kamis, serta Minggu siang."
        ),
        "jadwal": {SEL: [("19:00", "21:00")], KAM: [("19:00", "21:00")], MIN: [("13:00", "16:00")]},
    },
    {
        "slug": "kevin.hartanto",
        "nama_lengkap": "Kevin Hartanto, S.H., M.H.",
        "gelar_akademik": "S.H., M.H.",
        "pendidikan_terakhir": "S2 Hukum Teknologi Informasi, Universitas Padjadjaran",
        "spesialisasi": "Teknologi Informasi",
        "kota_praktik": "Jakarta Selatan",
        "pengalaman_tahun": 6,
        "tarif_per_sesi": 450000,
        "bio_singkat": "Advokat hukum siber: UU ITE, pelindungan data pribadi, dan sengketa transaksi online.",
        "deskripsi_lengkap": (
            "Fokus pada pencemaran nama baik di media sosial, penipuan online, kebocoran data pribadi (UU PDP), "
            "dan kepatuhan platform digital. Membantu korban mengamankan bukti elektronik dan membuat laporan. "
            "Konsultasi khusus malam hari kerja."
        ),
        "jadwal": {h: [("20:00", "22:00")] for h in HARI_KERJA},
    },
    {
        "slug": "rizky.harahap",
        "nama_lengkap": "Muhammad Rizky Harahap, S.H.",
        "gelar_akademik": "S.H.",
        "pendidikan_terakhir": "S1 Ilmu Hukum, Universitas Sumatera Utara",
        "spesialisasi": "Umum",
        "kota_praktik": "Medan",
        "pengalaman_tahun": 3,
        "tarif_per_sesi": 125000,
        "bio_singkat": "Advokat muda untuk konsultasi hukum umum sehari-hari dengan tarif terjangkau.",
        "deskripsi_lengkap": (
            "Melayani konsultasi awal untuk berbagai persoalan: sengketa jual beli, surat-menyurat hukum, "
            "laporan polisi sederhana, dan pengurusan dokumen. Cocok untuk klien yang ingin memahami posisi "
            "hukumnya dulu sebelum mengambil langkah. Jadwal pagi dan siang, Senin sampai Sabtu."
        ),
        "jadwal": {h: [("08:00", "12:00"), ("13:00", "16:00")] for h in (*HARI_KERJA, SAB)},
    },
    {
        "slug": "andi.fitriani",
        "nama_lengkap": "Andi Fitriani Rahman, S.H., M.H.",
        "gelar_akademik": "S.H., M.H.",
        "pendidikan_terakhir": "S2 Ilmu Hukum, Universitas Hasanuddin",
        "spesialisasi": "Umum",
        "kota_praktik": "Makassar",
        "pengalaman_tahun": 9,
        "tarif_per_sesi": 250000,
        "bio_singkat": "Advokat hukum umum di Makassar; jadwal konsultasi online sedang diperbarui.",
        "deskripsi_lengkap": (
            "Menangani perkara perdata dan pidana umum di wilayah Sulawesi Selatan. Untuk sementara belum "
            "membuka jadwal konsultasi online."
        ),
        "jadwal": {},  # sengaja kosong: menguji label "belum ada jadwal"
    },
    # --- Akun kontrol: TIDAK boleh pernah direkomendasikan AI ---
    {
        "slug": "kontrol.pending",
        "nama_lengkap": "Yoga Pratama Saputra, S.H.",
        "gelar_akademik": "S.H.",
        "pendidikan_terakhir": "S1 Ilmu Hukum, Universitas Pasundan",
        "spesialisasi": "Ketenagakerjaan",
        "kota_praktik": "Bandung",
        "pengalaman_tahun": 2,
        "tarif_per_sesi": 50000,
        "status_verifikasi": "pending",
        "bio_singkat": "Akun kontrol: belum terverifikasi, tarif termurah dan jadwal penuh.",
        "deskripsi_lengkap": "Akun kontrol pengujian. Kalau muncul di rekomendasi AI, filter verifikasi tidak bekerja.",
        "jadwal": {h: [("08:00", "22:00")] for h in range(7)},
    },
    {
        "slug": "kontrol.nonaktif",
        "nama_lengkap": "Lukas Adiwijaya, S.H.",
        "gelar_akademik": "S.H.",
        "pendidikan_terakhir": "S1 Ilmu Hukum, Universitas Kristen Maranatha",
        "spesialisasi": "Pidana",
        "kota_praktik": "Bandung",
        "pengalaman_tahun": 6,
        "tarif_per_sesi": 100000,
        "is_active": False,
        "bio_singkat": "Akun kontrol: terverifikasi tetapi nonaktif.",
        "deskripsi_lengkap": "Akun kontrol pengujian. Kalau muncul di rekomendasi AI, filter is_active tidak bekerja.",
        "jadwal": {h: [("09:00", "17:00")] for h in HARI_KERJA},
    },
]

KOLOM_KONSULTAN = (
    "nama_lengkap",
    "gelar_akademik",
    "pendidikan_terakhir",
    "spesialisasi",
    "kota_praktik",
    "pengalaman_tahun",
    "tarif_per_sesi",
    "bio_singkat",
    "deskripsi_lengkap",
)


def email(profil: dict) -> str:
    return f"{EMAIL_PREFIX}{profil['slug']}@{EMAIL_DOMAIN}"


def jadwal_berulang(pola: dict, mulai: date, minggu: int) -> list[dict]:
    rows = []
    for offset in range(minggu * 7):
        hari = mulai + timedelta(days=offset)
        for jam_mulai, jam_selesai in pola.get(hari.weekday(), []):
            rows.append({"tanggal": hari.isoformat(), "jam_mulai": jam_mulai, "jam_selesai": jam_selesai})
    return rows


class AuthAdmin:
    def __init__(self):
        self.base = f"{os.environ['SUPABASE_URL']}/auth/v1/admin"
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    def semua_demo(self) -> list[dict]:
        hasil, page = [], 1
        while True:
            resp = httpx.get(f"{self.base}/users", params={"page": page, "per_page": 200}, headers=self.headers)
            resp.raise_for_status()
            users = resp.json().get("users", [])
            hasil += [u for u in users if (u.get("email") or "").startswith(EMAIL_PREFIX)]
            if len(users) < 200:
                return hasil
            page += 1

    def buat(self, email_: str, nama: str) -> dict:
        body = {
            "email": email_,
            "password": secrets.token_urlsafe(24),
            "email_confirm": True,
            "user_metadata": {"full_name": nama},
        }
        resp = httpx.post(f"{self.base}/users", json=body, headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    def hapus(self, user_id: str) -> None:
        httpx.delete(f"{self.base}/users/{user_id}", headers=self.headers).raise_for_status()


def seed(db, dry_run: bool) -> None:
    mulai = date.today()
    auth = None if dry_run else AuthAdmin()
    auth_ada = {} if dry_run else {u["email"]: u for u in auth.semua_demo()}

    for profil in PROFIL:
        jadwal = jadwal_berulang(profil["jadwal"], mulai, MINGGU_JADWAL)
        status = profil.get("status_verifikasi", "terverifikasi")
        aktif = profil.get("is_active", True)
        print(
            f"{profil['nama_lengkap'][:38]:38s} {profil['spesialisasi']:19s} {profil['kota_praktik']:15s} "
            f"Rp{profil['tarif_per_sesi']:>7,} {status:13s} aktif={aktif!s:5s} slot_jadwal={len(jadwal)}"
        )
        if dry_run:
            continue

        alamat = email(profil)
        auth_user = auth_ada.get(alamat) or auth.buat(alamat, profil["nama_lengkap"])
        user_row = {
            "auth_user_id": auth_user["id"],
            "email": alamat,
            "nama": profil["nama_lengkap"],
            "role": "konsultan",
        }
        ada = db.table("users").select("id_user").eq("email", alamat).execute().data
        if ada:
            id_user = ada[0]["id_user"]
            db.table("users").update(user_row).eq("id_user", id_user).execute()
        else:
            id_user = db.table("users").insert(user_row).execute().data[0]["id_user"]

        data = {k: profil[k] for k in KOLOM_KONSULTAN}
        data.update(
            {
                "id_user": id_user,
                "status_verifikasi": status,
                "is_active": aktif,
                "nomor_izin_praktik": f"DEMO-{profil['slug'].upper()}",
            }
        )
        ada = db.table("konsultan").select("id_konsultan").eq("id_user", id_user).execute().data
        if ada:
            id_konsultan = ada[0]["id_konsultan"]
            db.table("konsultan").update(data).eq("id_konsultan", id_konsultan).execute()
        else:
            id_konsultan = db.table("konsultan").insert(data).execute().data[0]["id_konsultan"]

        sudah = {
            (r["tanggal"], str(r["jam_mulai"])[:5])
            for r in db.table("jadwal_ketersediaan")
            .select("tanggal,jam_mulai")
            .eq("id_konsultan", id_konsultan)
            .gte("tanggal", mulai.isoformat())
            .execute()
            .data
        }
        baru = [
            {**j, "id_konsultan": id_konsultan, "status_tersedia": True}
            for j in jadwal
            if (j["tanggal"], j["jam_mulai"]) not in sudah
        ]
        for i in range(0, len(baru), 200):
            db.table("jadwal_ketersediaan").insert(baru[i : i + 200]).execute()
        print(f"   -> id_konsultan={id_konsultan}, jadwal baru {len(baru)}")


def hapus_semua(db) -> None:
    auth = AuthAdmin()
    for u in auth.semua_demo():
        rows = db.table("users").select("id_user").eq("email", u["email"]).execute().data
        for r in rows:
            for k in db.table("konsultan").select("id_konsultan").eq("id_user", r["id_user"]).execute().data:
                db.table("jadwal_ketersediaan").delete().eq("id_konsultan", k["id_konsultan"]).execute()
                db.table("konsultan").delete().eq("id_konsultan", k["id_konsultan"]).execute()
            db.table("users").delete().eq("id_user", r["id_user"]).execute()
        auth.hapus(u["id"])
        print(f"dihapus: {u['email']}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="tampilkan rencana tanpa menulis ke database")
    parser.add_argument("--hapus", action="store_true", help="hapus semua akun demo beserta profil dan jadwalnya")
    args = parser.parse_args()
    db = get_supabase_client()
    if args.hapus:
        hapus_semua(db)
    else:
        seed(db, args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
