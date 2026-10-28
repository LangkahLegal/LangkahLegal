"""Eval pencarian pasal (retrieval) terhadap knowledge base sungguhan.

Yang diukur hanya langkah pencarian: pasal apa saja yang dikirim ke model untuk sebuah pertanyaan. Tidak
memanggil Gemini, kecuali saat menyiapkan query. Jalankan dari folder backend:

    python -m evals.retrieval_eval --siapkan-query   # sekali: isi 'query' tiap kasus memakai classifier
    python -m evals.retrieval_eval                   # ukur
    python -m evals.retrieval_eval --simpan sesudah  # ukur dan simpan ringkasan ke evals/reports/

Metrik:
- hit@1, hit@3 : pasal yang benar ada di urutan pertama / di antara pasal yang dikirim
- mrr          : rata-rata 1/peringkat pasal benar pertama (1 = selalu paling atas)
- terbaru@3    : untuk kasus yang punya versi aturan terbaru, versi itu ikut terambil
- penjelasan   : porsi pasal terkirim yang sebenarnya bagian Penjelasan, bukan bunyi pasal
- duplikat     : jumlah pasal terkirim yang isinya kembar dengan pasal lain di hasil yang sama
- huruf        : rata-rata panjang teks pasal yang dikirim (perkiraan beban token)
"""

import argparse
import hashlib
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path

from core.database import get_supabase_client
from services import chat_policy, rag_service

EVAL_DIR = Path(__file__).resolve().parent
CASES_PATH = EVAL_DIR / "retrieval_cases.json"
CACHE_PATH = EVAL_DIR / ".cache" / "query_embeddings.json"
REPORT_DIR = EVAL_DIR / "reports"
JEDA_CLASSIFIER = 4


def _muat_kasus() -> dict:
    return json.loads(CASES_PATH.read_text(encoding="utf-8"))


def siapkan_query() -> int:
    data = _muat_kasus()
    client = rag_service._get_gemini_client()
    for kasus in data["kasus"]:
        if kasus.get("query"):
            continue
        klasifikasi = chat_policy.classify(client, kasus["pertanyaan"], [])
        if klasifikasi is None:
            print(f"GAGAL classify: {kasus['id']} (coba lagi nanti)")
            continue
        kasus["query"] = klasifikasi.query_pencarian
        print(f"{kasus['id']:28s} -> {kasus['query']}")
        CASES_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        time.sleep(JEDA_CLASSIFIER)
    return 0


def _kunci(teks: str) -> str:
    return hashlib.sha1(teks.encode("utf-8")).hexdigest()


def _pasang_cache_embedding(queries: list[str]) -> None:
    """Embedding query diambil sekali (satu request untuk semua query), lalu dipakai ulang di run berikutnya."""
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}
    kurang = sorted({q for q in queries if _kunci(q) not in cache})
    if kurang:
        hasil = rag_service._get_voyage_client().embed(kurang, model=rag_service.EMBEDDING_MODEL, input_type="query")
        cache.update({_kunci(q): e for q, e in zip(kurang, hasil.embeddings)})
        CACHE_PATH.parent.mkdir(exist_ok=True)
        CACHE_PATH.write_text(json.dumps(cache), encoding="utf-8")
    rag_service.embed_query = lambda q: cache[_kunci(q)] if _kunci(q) in cache else _embed_asli(q)


_embed_asli = rag_service.embed_query


def _cocok(row: dict, target: dict) -> bool:
    akhiran, pasal = target["ref"].split(":", 1)
    if not (row.get("frbr_uri") or "").endswith("/" + akhiran):
        return False
    if (row.get("pasal_bagian") or "").strip().lower() != pasal.strip().lower():
        return False
    return not target.get("memuat") or bool(re.search(target["memuat"], row.get("isi_teks") or "", re.I))


def _ambil(db, kasus: dict) -> list[dict]:
    # Pipeline pencarian yang sama dengan yang dipakai triage.
    return rag_service.cari_pasal(db, kasus["pertanyaan"], kasus["query"])


def _penjelasan(row: dict, ids_penjelasan: set[int]) -> bool:
    return (
        bool(row.get("penjelasan"))
        or (row.get("pasal_bagian") or "").lower().startswith("penjelasan")
        or row.get("id_dokumen") in ids_penjelasan
    )


def jalankan(args) -> int:
    data = _muat_kasus()
    kasus_list = [k for k in data["kasus"] if k.get("query")]
    if len(kasus_list) < len(data["kasus"]):
        print(f"{len(data['kasus']) - len(kasus_list)} kasus belum punya query; jalankan --siapkan-query dulu.")
    ids_penjelasan = set(json.loads(Path(args.ids_penjelasan).read_text())) if args.ids_penjelasan else set()

    _pasang_cache_embedding([k["query"] for k in kasus_list])
    db = get_supabase_client()

    total = {"hit1": 0, "hit3": 0, "rr": 0.0, "terbaru": 0, "n_terbaru": 0, "penjelasan": 0, "duplikat": 0}
    jumlah_pasal = jumlah_huruf = 0
    detail = []
    for kasus in kasus_list:
        hasil = _ambil(db, kasus)
        peringkat = next((i + 1 for i, r in enumerate(hasil) if any(_cocok(r, t) for t in kasus["relevan"])), None)
        total["hit1"] += peringkat == 1
        total["hit3"] += peringkat is not None
        total["rr"] += 1 / peringkat if peringkat else 0
        terbaru_ok = None
        if kasus.get("terbaru"):
            total["n_terbaru"] += 1
            terbaru_ok = any(_cocok(r, t) for r in hasil for t in kasus["terbaru"])
            total["terbaru"] += terbaru_ok
        awal_teks = [re.sub(r"\s+", " ", r.get("isi_teks") or "")[:200] for r in hasil]
        total["duplikat"] += len(awal_teks) - len(set(awal_teks))
        total["penjelasan"] += sum(_penjelasan(r, ids_penjelasan) for r in hasil)
        jumlah_pasal += len(hasil)
        jumlah_huruf += sum(len(r.get("isi_teks") or "") for r in hasil)

        label = [f"{r['frbr_uri'].rsplit('/', 1)[-1]}:{r.get('pasal_bagian')}" for r in hasil]
        status = "OK  " if peringkat else "MISS"
        versi = "" if terbaru_ok is None else (" terbaru=ya" if terbaru_ok else " terbaru=TIDAK")
        print(f"[{status}] {kasus['id']:26s} peringkat={peringkat or '-'}{versi} | {', '.join(label)}")
        detail.append({"id": kasus["id"], "peringkat": peringkat, "terbaru": terbaru_ok, "hasil": label})

    n = len(kasus_list)
    ringkasan = {
        "kasus": n,
        "hit@1": round(total["hit1"] / n, 3),
        "hit@3": round(total["hit3"] / n, 3),
        "mrr": round(total["rr"] / n, 3),
        "terbaru@3": round(total["terbaru"] / total["n_terbaru"], 3) if total["n_terbaru"] else None,
        "porsi_penjelasan": round(total["penjelasan"] / max(jumlah_pasal, 1), 3),
        "duplikat": total["duplikat"],
        "rata_huruf_per_pertanyaan": round(jumlah_huruf / n),
    }
    print("\n=== RINGKASAN ===")
    for k, v in ringkasan.items():
        print(f"{k:28s}: {v}")

    if args.simpan:
        REPORT_DIR.mkdir(exist_ok=True)
        path = REPORT_DIR / f"retrieval-{datetime.now():%Y%m%d-%H%M%S}-{args.simpan}.json"
        path.write_text(
            json.dumps({"ringkasan": ringkasan, "detail": detail}, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"\nDisimpan: {path}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--siapkan-query", action="store_true", help="isi query tiap kasus memakai classifier")
    parser.add_argument(
        "--simpan", metavar="LABEL", help="simpan ringkasan ke evals/reports/retrieval-<waktu>-<LABEL>.json"
    )
    parser.add_argument(
        "--ids-penjelasan", help="file JSON berisi id chunk Penjelasan (untuk data sebelum dibersihkan)"
    )
    args = parser.parse_args()
    return siapkan_query() if args.siapkan_query else jalankan(args)


if __name__ == "__main__":
    sys.exit(main())
