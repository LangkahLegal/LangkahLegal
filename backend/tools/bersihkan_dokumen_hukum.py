"""Bersihkan tabel dokumen_hukum (knowledge base chatbot). Jalankan manual dari folder backend:

    python tools/bersihkan_dokumen_hukum.py --backup-dir <folder> --dry-run   # lihat rencana
    python tools/bersihkan_dokumen_hukum.py --backup-dir <folder>             # backup lalu eksekusi
    python tools/bersihkan_dokumen_hukum.py --pulihkan <file backup>          # kembalikan dari backup

Yang dilakukan:
1. Hapus chunk yang isinya hanya "Cukup jelas" (bagian Penjelasan tanpa isi) atau label tanpa isi.
2. Chunk Penjelasan yang ada isinya diberi label "Penjelasan Pasal N", supaya tidak dikutip sebagai bunyi pasal.
3. Hapus dokumen kembar (dokumen yang sama tersimpan dengan frbr_uri lain).
4. Perbaiki metadata dokumen yang rusak dan seragamkan status_hukum.

Embedding tidak berubah, jadi tidak ada panggilan ke Voyage.
"""

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from core.database import get_supabase_client  # noqa: E402
from helpers import penjelasan  # noqa: E402

TABLE = "dokumen_hukum"
HALAMAN = 500
BATCH_HAPUS = 200

# frbr_uri kembar -> frbr_uri yang dipertahankan (isinya sama, metadata yang dipertahankan lebih rapi).
DOKUMEN_KEMBAR = {
    "/akn/id/act/t4-001": "/akn/id/act/t1-013",  # UU 27/2022 PDP
    "/akn/id/act/t3-022": "/akn/id/act/t3-006",  # PP 17/2025
    "/akn/id/act/uu-0-0": "/akn/id/act/uu-1-2024",  # UU 1/2024, metadata "UU No. 0 Tahun 0"
    "/akn/id/act/t4-003": "/akn/id/act/uu-5-1960",  # UU 5/1960, hanya Preambule
    "/akn/id/act/t4-016": "/akn/id/act/uu-5-1960",  # UU 5/1960, hanya Preambule
}

# Metadata yang salah atau kosong. Judul resmi dicek di JDIH BPK (lihat data/peraturan_files.json).
PERBAIKAN_METADATA = {
    "/akn/id/act/uu--0": {"nomor_uu": "UU No. 1 Tahun 2025", "tahun_uu": 2025, "nama_uu": "UU BUMN Perubahan Ketiga"},
    "/akn/id/act/uu-1-1946": {"nama_uu": "UU Peraturan Hukum Pidana (KUHP 1946)"},
    "/akn/id/act/uu-5-1960": {"nama_uu": "UU Pokok Agraria", "kategori": "perdata"},
    "/akn/id/act/uu-3-2025": {"nama_uu": "UU TNI Perubahan"},
}


def ambil_semua(db, kolom: str) -> list[dict]:
    rows, start = [], 0
    while True:
        batch = db.table(TABLE).select(kolom).order("id_dokumen").range(start, start + HALAMAN - 1).execute().data
        rows += batch
        if len(batch) < HALAMAN:
            return rows
        start += HALAMAN


def susun_rencana(rows: list[dict]) -> dict:
    hapus, relabel = set(), {}
    per_dokumen = defaultdict(list)
    for r in rows:
        if r["frbr_uri"] in DOKUMEN_KEMBAR:
            hapus.add(r["id_dokumen"])
        else:
            per_dokumen[r["frbr_uri"]].append(r)

    for rs in per_dokumen.values():
        rs.sort(key=lambda r: r["id_dokumen"])
        awal = penjelasan.awal_penjelasan([(r["pasal_bagian"], r["isi_teks"]) for r in rs])
        id_penjelasan = {r["id_dokumen"] for r in rs[awal:]} if awal is not None else set()
        for r in rs:
            if penjelasan.hanya_cukup_jelas(r["isi_teks"]):
                hapus.add(r["id_dokumen"])
            elif r["id_dokumen"] in id_penjelasan and not (r["pasal_bagian"] or "").startswith("Penjelasan"):
                label = penjelasan.label_penjelasan(r["pasal_bagian"])
                relabel[r["id_dokumen"]] = {
                    "pasal_bagian": label,
                    "judul_bab": "Penjelasan",
                    "isi_teks": f"{label}\n{penjelasan.isi_tanpa_judul(r['isi_teks'])}",
                }

    metadata = defaultdict(dict)
    for r in rows:
        if r["frbr_uri"] in DOKUMEN_KEMBAR:
            continue
        perbaikan = dict(PERBAIKAN_METADATA.get(r["frbr_uri"], {}))
        if (r.get("status_hukum") or "") != (r.get("status_hukum") or "").lower():
            perbaikan["status_hukum"] = r["status_hukum"].lower()
        if perbaikan:
            metadata[r["id_dokumen"]] = perbaikan
    return {"hapus": hapus, "relabel": relabel, "metadata": dict(metadata)}


def cetak_rencana(rows: list[dict], rencana: dict) -> None:
    by_id = {r["id_dokumen"]: r for r in rows}
    kembar = sum(1 for i in rencana["hapus"] if by_id[i]["frbr_uri"] in DOKUMEN_KEMBAR)
    print(f"Total chunk sekarang         : {len(rows)}")
    print(f"Dihapus (dokumen kembar)     : {kembar} chunk dari {len(DOKUMEN_KEMBAR)} dokumen")
    print(f"Dihapus ('Cukup jelas'/kosong): {len(rencana['hapus']) - kembar}")
    print(f"Dilabel ulang jadi Penjelasan: {len(rencana['relabel'])}")
    print(f"Metadata diperbaiki          : {len(rencana['metadata'])} chunk")
    print(f"Sisa chunk sesudahnya        : {len(rows) - len(rencana['hapus'])}")
    for i, upd in list(rencana["relabel"].items())[:3]:
        print(f"  contoh relabel {i}: {by_id[i]['pasal_bagian']!r} -> {upd['pasal_bagian']!r}")


def backup(db, folder: Path) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"dokumen_hukum-{datetime.now():%Y%m%d-%H%M%S}.json"
    rows = ambil_semua(db, "*")
    path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
    print(f"Backup {len(rows)} baris (dengan embedding) -> {path} ({path.stat().st_size / 1e6:.0f} MB)")
    return path


def eksekusi(db, rencana: dict) -> None:
    hapus = sorted(rencana["hapus"])
    for i in range(0, len(hapus), BATCH_HAPUS):
        db.table(TABLE).delete().in_("id_dokumen", hapus[i : i + BATCH_HAPUS]).execute()
    print(f"Terhapus {len(hapus)} chunk")

    perubahan = defaultdict(dict)
    for sumber in (rencana["relabel"], rencana["metadata"]):
        for id_dokumen, data in sumber.items():
            perubahan[id_dokumen].update(data)
    for n, (id_dokumen, data) in enumerate(sorted(perubahan.items()), 1):
        db.table(TABLE).update(data).eq("id_dokumen", id_dokumen).execute()
        if n % 250 == 0:
            print(f"  diperbarui {n}/{len(perubahan)}")
    print(f"Diperbarui {len(perubahan)} chunk")


def pulihkan(db, path: Path) -> None:
    """Kembalikan baris yang terhapus dan kolom teks/metadata yang berubah, sesuai isi backup."""
    cadangan = json.loads(path.read_text(encoding="utf-8"))
    sekarang = {r["id_dokumen"]: r for r in ambil_semua(db, "id_dokumen")}
    hilang = [r for r in cadangan if r["id_dokumen"] not in sekarang]
    for i in range(0, len(hilang), 100):
        db.table(TABLE).insert(hilang[i : i + 100]).execute()
    kolom = ("pasal_bagian", "judul_bab", "isi_teks", "nama_uu", "nomor_uu", "tahun_uu", "kategori", "status_hukum")
    for r in cadangan:
        if r["id_dokumen"] in sekarang:
            db.table(TABLE).update({k: r[k] for k in kolom}).eq("id_dokumen", r["id_dokumen"]).execute()
    print(f"Dipulihkan: {len(hilang)} baris dimasukkan lagi, {len(cadangan) - len(hilang)} baris dikembalikan isinya")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--backup-dir", type=Path, help="folder untuk file backup (wajib kecuali --dry-run)")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--pulihkan", type=Path, help="file backup yang akan dikembalikan")
    args = parser.parse_args()
    db = get_supabase_client()

    if args.pulihkan:
        pulihkan(db, args.pulihkan)
        return 0

    rows = ambil_semua(db, "id_dokumen,frbr_uri,pasal_bagian,isi_teks,status_hukum")
    rencana = susun_rencana(rows)
    cetak_rencana(rows, rencana)
    if args.dry_run:
        return 0
    if not args.backup_dir:
        parser.error("--backup-dir wajib diisi supaya ada backup sebelum data diubah")
    backup(db, args.backup_dir)
    eksekusi(db, rencana)
    return 0


if __name__ == "__main__":
    sys.exit(main())
