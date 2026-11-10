"use client";

import { MaterialIcon, UserAvatar } from "@/components/ui";
import Link from "next/link";

export default function ConsultantCard({ consultant }) {
  const { name, spec, rating, reviews, status, foto_profil, status_verifikasi, tarif_per_sesi } = consultant;

  const detailHref = consultant?.id ? `/explore/${consultant.id}` : "/explore";

  return (
    <div
      className="bg-card border border-surface rounded-2xl overflow-hidden flex flex-col h-full group hover:border-primary/40 transition-all duration-300 shadow-soft"
      data-testid="consultant-card"
    >
      {/* Foto persegi seperti kartu produk marketplace */}
      <div className="relative aspect-square lg:aspect-4/3 bg-bg overflow-hidden">
        <UserAvatar
          src={foto_profil}
          name={name || "Konsultan"}
          alt={name || "Konsultan"}
          size="xl"
          textClassName="text-3xl lg:text-4xl"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <span
          className={`absolute top-2.5 right-2.5 w-3 h-3 rounded-full border-2 border-card transition-colors duration-500 ${
            status === "online"
              ? "bg-success shadow-soft"
              : "bg-muted"
          }`}
        />

        {spec && (
          <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate px-2.5 py-0.5 rounded-full bg-card/90 backdrop-blur-sm text-primary-light text-[10px] lg:text-[11px] font-bold">
            {spec}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 gap-1.5 p-3 lg:p-3.5">
        <h3 className="font-headline font-bold text-main text-sm leading-snug line-clamp-2">
          {name}
          {status_verifikasi === "terverifikasi" && (
            <MaterialIcon
              name="verified"
              className="text-info-text text-sm align-[-2px] ml-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
              title="Verified"
            />
          )}
        </h3>

        <div className="flex items-center gap-1 text-[11px] text-muted">
          <MaterialIcon
            name="star"
            className="text-secondary text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          />
          <span className="font-bold text-main">{rating}</span>
          <span className="opacity-60 truncate">({reviews} Ulasan)</span>
        </div>

        {tarif_per_sesi > 0 && (
          <p className="text-sm font-black text-main">
            Rp {tarif_per_sesi.toLocaleString("id-ID")}
            <span className="text-[11px] font-medium text-muted"> /sesi</span>
          </p>
        )}
        {tarif_per_sesi === 0 && (
          <p className="text-sm font-black text-success">Gratis</p>
        )}

        <Link
          href={detailHref}
          className="mt-auto pt-2 block"
        >
          <span className="block w-full text-center py-2 text-xs font-bold rounded-xl bg-surface border border-surface text-main group-hover:border-primary/40 hover:bg-primary! hover:text-on-primary! transition-all active:scale-95">
            Lihat
          </span>
        </Link>
      </div>
    </div>
  );
}
