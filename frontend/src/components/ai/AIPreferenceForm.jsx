"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";

const formatRupiah = (nilai) => `Rp${Number(nilai).toLocaleString("id-ID")}`;

const toNumber = (teks) => {
  const angka = String(teks || "").replace(/\D/g, "");
  return angka ? Number(angka) : null;
};

function Chip({ active, onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full border text-[11px] sm:text-xs font-medium transition-colors disabled:opacity-50 ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-bg border-surface text-muted hover:text-main hover:border-muted/40"
      }`}
    >
      {children}
    </button>
  );
}

/** Ringkasan isian form dalam satu kalimat, dikirim sebagai pesan klien supaya riwayat chat tetap terbaca. */
function ringkas({ kategoriLabel, budgetMin, budgetMax, hariLabel, waktuLabel }) {
  const bagian = [`Cari konsultan ${kategoriLabel}`];
  if (budgetMin && budgetMax) bagian.push(`budget ${formatRupiah(budgetMin)}-${formatRupiah(budgetMax)}`);
  else if (budgetMax) bagian.push(`budget maksimal ${formatRupiah(budgetMax)}`);
  else if (budgetMin) bagian.push(`budget minimal ${formatRupiah(budgetMin)}`);
  if (hariLabel) bagian.push(hariLabel.toLowerCase());
  if (waktuLabel) bagian.push(waktuLabel.split(" (")[0].toLowerCase());
  return bagian.join(", ");
}

/** Form budget dan jadwal yang muncul saat Kia bertanya sebelum merekomendasikan konsultan. */
export default function AIPreferenceForm({ form, active, onSubmit }) {
  const awal = form.nilai_awal || {};
  const [kategori, setKategori] = useState(awal.kategori || form.kategori);
  const [budgetMin, setBudgetMin] = useState(awal.budget_min ? String(awal.budget_min) : "");
  const [budgetMax, setBudgetMax] = useState(awal.budget_max ? String(awal.budget_max) : "");
  const [hari, setHari] = useState(awal.hari || "");
  const [waktu, setWaktu] = useState(awal.waktu || "");
  const [error, setError] = useState("");

  if (!active) {
    return (
      <p className="mt-4 text-[11px] sm:text-xs text-muted italic" data-testid="ai-preference-form-done">
        Preferensi konsultasi sudah dikirim.
      </p>
    );
  }

  const labelDari = (pilihan, nilai) => pilihan.find((p) => p.nilai === nilai)?.label || "";

  const kirim = () => {
    const min = toNumber(budgetMin);
    const max = toNumber(budgetMax);
    if (min && max && min > max) {
      setError("Budget minimal tidak boleh lebih besar dari budget maksimal.");
      return;
    }
    setError("");
    const preferensi = {
      kategori,
      budget_min: min,
      budget_max: max,
      hari: hari || null,
      waktu: waktu || null,
      dilewati: false,
    };
    onSubmit(
      preferensi,
      ringkas({
        kategoriLabel: labelDari(form.pilihan_kategori, kategori).toLowerCase() || "hukum",
        budgetMin: min,
        budgetMax: max,
        hariLabel: hari && hari !== "bebas" ? labelDari(form.pilihan_hari, hari) : "",
        waktuLabel: waktu && waktu !== "bebas" ? labelDari(form.pilihan_waktu, waktu) : "",
      }),
    );
  };

  const lewati = () => onSubmit({ kategori, dilewati: true }, "Lewati, tampilkan semua konsultan");

  const inputClass =
    "w-full bg-input border border-surface rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-main placeholder:text-muted/60 focus:outline-none focus:border-primary/60";

  return (
    <div className="mt-5 pt-4 border-t border-surface/50 space-y-4" data-testid="ai-preference-form">
      <Dropdown
        label="Kategori hukum"
        value={kategori}
        options={form.pilihan_kategori.map((p) => ({ value: p.nilai, label: p.label }))}
        onChange={setKategori}
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-main">Budget per sesi</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Minimal", budgetMin, setBudgetMin, "preferensi-budget-min", "100000"],
            ["Maksimal", budgetMax, setBudgetMax, "preferensi-budget-max", "300000"],
          ].map(([label, nilai, setNilai, testId, contoh]) => (
            <label key={label} className="space-y-1">
              <span className="text-[10px] sm:text-[11px] text-muted">{label}</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={nilai ? Number(toNumber(nilai)).toLocaleString("id-ID") : ""}
                  onChange={(e) => setNilai(String(toNumber(e.target.value) ?? ""))}
                  placeholder={Number(contoh).toLocaleString("id-ID")}
                  aria-label={`Budget ${label.toLowerCase()}`}
                  data-testid={testId}
                  className={inputClass}
                />
              </div>
            </label>
          ))}
        </div>
        <p className="text-[10px] text-muted">Kosongkan kalau tidak ada batas.</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-main">Hari</p>
        <div className="flex flex-wrap gap-1.5">
          {form.pilihan_hari.map((p) => (
            <Chip key={p.nilai} active={hari === p.nilai} onClick={() => setHari(hari === p.nilai ? "" : p.nilai)}>
              {p.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-main">Waktu</p>
        <div className="flex flex-wrap gap-1.5">
          {form.pilihan_waktu.map((p) => (
            <Chip key={p.nilai} active={waktu === p.nilai} onClick={() => setWaktu(waktu === p.nilai ? "" : p.nilai)}>
              {p.label}
            </Chip>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-danger flex items-center gap-1" role="alert">
          <MaterialIcon name="error" className="text-[14px]" />
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="primary" className="!py-2 !px-4 text-xs font-semibold" onClick={kirim}>
          Cari konsultan
        </Button>
        <Button variant="outline" className="!py-2 !px-4 text-xs font-semibold" onClick={lewati}>
          Lewati, tampilkan semua
        </Button>
      </div>
    </div>
  );
}
