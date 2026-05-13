"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";
import { consultationService } from "@/services/consultation.service";

export default function ZoomLinkCard({
  link,
  status,
  role = "client",
  consultationId,
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [zoomInput, setZoomInput] = useState(link || "");
  const [internalRole, setInternalRole] = useState(role);
  const queryClient = useQueryClient();

  // Secondary check for role to ensure we didn't miss it
  useEffect(() => {
    if (role === "client") {
      const storageRole = localStorage.getItem("userRole") || 
                         localStorage.getItem("role") || 
                         localStorage.getItem("user_role");
      if (storageRole) {
        const normalized = storageRole.toLowerCase();
        if (normalized.includes("konsultan") || normalized.includes("consultant")) {
          setInternalRole("konsultan");
        }
      }
    } else {
      setInternalRole(role);
    }
  }, [role]);

  // 1. FILTER STATUS - Izinkan juga saat menunggu pembayaran agar bisa siap-siap
  const allowedStatuses = ["terjadwal", "selesai", "menunggu_pembayaran"];
  if (!allowedStatuses.includes(status)) {
    return null;
  }

  // 2. CHECK ROLE - Pastikan fleksibel terhadap string role
  const isKonsultan = internalRole === "konsultan" || internalRole === "consultant";

  // 2. MUTATION: Save Zoom Link
  const zoomMutation = useMutation({
    mutationFn: (newLink) =>
      consultationService.updateZoomLink(consultationId, newLink),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["consultationRequest", String(consultationId)],
      });
      setIsEditing(false);
    },
    onError: (err) => {
      alert(err?.response?.data?.detail || "Gagal menyimpan link Zoom");
    },
  });

  // 3. HANDLER
  const handleCopyLink = async () => {
    if (!link || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin link:", err);
    }
  };

  const handleSaveZoom = () => {
    if (!zoomInput.trim()) return;
    zoomMutation.mutate(zoomInput.trim());
  };

  const buttonLabel =
    isKonsultan ? "Mulai Sesi Konsultasi" : "Gabung Sesi Konsultasi";

  const canJoin = status === "terjadwal";

  // 4. RENDER UI
  return (
    <section className="space-y-4">
      {/* Label Title */}
      <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-2">
        Link Zoom Meetings
      </h3>

      {/* Consultant: Edit Mode */}
      {isKonsultan && isEditing ? (
        <div className="bg-card rounded-2xl p-4 border border-surface space-y-3 transition-colors duration-500">
          <div className="flex items-center gap-2 mb-1">
            <MaterialIcon name="videocam" className="text-primary-light text-base" />
            <span className="text-xs font-bold text-main uppercase tracking-wider">
              Masukkan Link Zoom
            </span>
          </div>
          <input
            type="url"
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value)}
            placeholder="https://zoom.us/j/123456789"
            className="w-full bg-input border border-surface rounded-xl px-4 py-3 text-main text-sm placeholder:text-muted/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              fullWidth
              onClick={handleSaveZoom}
              isLoading={zoomMutation.isPending}
              disabled={!zoomInput.trim()}
              className="!rounded-xl !py-3"
            >
              <MaterialIcon name="save" className="text-lg" />
              Simpan
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditing(false);
                setZoomInput(link || "");
              }}
              className="!rounded-xl !py-3"
            >
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Container Link */}
          <div className="bg-card rounded-2xl p-3 border border-surface flex items-center gap-3 transition-colors duration-500">
            {/* Icon Area */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                link ? "bg-primary/20" : "bg-surface"
              }`}
            >
              <MaterialIcon
                name={link ? "videocam" : "link_off"}
                className={`text-sm ${link ? "text-primary-light" : "text-muted/50"}`}
              />
            </div>

            {/* URL Text */}
            <span
              className={`text-sm truncate flex-1 transition-colors duration-300 ${
                link ? "text-main font-medium" : "text-muted/40 italic"
              }`}
            >
              {link ? link : "Link belum tersedia"}
            </span>

            {/* Tombol Copy */}
            {link && (
              <div className="relative group">
                <button
                  onClick={handleCopyLink}
                  className="p-2 text-muted hover:text-main hover:bg-surface rounded-xl transition-all flex items-center justify-center"
                >
                  <MaterialIcon
                    name={copied ? "check" : "content_copy"}
                    className="text-[18px]"
                  />
                </button>

                {/* Tooltip Copy */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-bg text-main text-[10px] font-bold rounded-lg border border-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-10">
                  {copied ? "Disalin!" : "Salin"}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-bg border-b border-r border-surface transform rotate-45"></div>
                </div>
              </div>
            )}

            {/* Tombol Edit (Konsultan only) */}
            {isKonsultan && (
              <button
                onClick={() => {
                  setZoomInput(link || "");
                  setIsEditing(true);
                }}
                className="p-2 text-muted hover:text-primary-light hover:bg-primary/10 rounded-xl transition-all flex items-center justify-center"
              >
                <MaterialIcon
                  name={link ? "edit" : "add_link"}
                  className="text-[18px]"
                />
              </button>
            )}
          </div>
        </>
      )}

      {/* Button Action */}
      {canJoin && (
        <Button
          variant="primary"
          fullWidth
          onClick={() => link && window.open(link, "_blank")}
          disabled={!link}
          className={!link ? "opacity-50 cursor-not-allowed" : ""}
        >
          {buttonLabel}
        </Button>
      )}
    </section>
  );
}
