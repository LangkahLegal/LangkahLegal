"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MaterialIcon } from "@/components/ui/Icons";

const emptySubscribe = () => () => {};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
  description = "",
}) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`bg-card w-full ${maxWidth} rounded-2xl border border-surface shadow-xl max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="flex justify-between items-center p-6 border-b border-surface">
          <div>
            <h3 className="text-main font-bold text-lg">{title}</h3>
            {description && (
              <p className="text-sm text-muted mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-main transition p-2 bg-surface/50 rounded-xl"
            aria-label="Tutup modal"
          >
            <MaterialIcon name="close" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

