"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

const FeedbackContext = createContext(null);

const DURATION = { success: 4000, info: 5000, error: 6000 };
const MAX_TOASTS = 4;

const VARIANT_STYLE = {
  success: { icon: "check_circle", className: "border-success/40 text-success" },
  error: { icon: "error", className: "border-danger/40 text-danger" },
  info: { icon: "info", className: "border-primary/40 text-primary" },
};

function Toast({ toast, onClose }) {
  const style = VARIANT_STYLE[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), DURATION[toast.variant]);
    return () => clearTimeout(timer);
  }, [toast.id, toast.variant, onClose]);

  return (
    <div
      data-testid="toast"
      data-variant={toast.variant}
      role={toast.variant === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft ${style.className}`}
    >
      <MaterialIcon name={style.icon} className="mt-0.5 text-xl" />
      <p data-testid="toast-message" className="flex-1 text-sm font-medium text-main">
        {toast.message}
      </p>
      <button
        type="button"
        data-testid="toast-close"
        aria-label="Tutup notifikasi"
        onClick={() => onClose(toast.id)}
        className="text-muted hover:text-main"
      >
        <MaterialIcon name="close" className="text-lg" />
      </button>
    </div>
  );
}

function ConfirmDialog({ request, onAnswer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onAnswer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnswer]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4">
      <div
        data-testid="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md space-y-4 rounded-2xl border border-surface bg-card p-6"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-main">
          {request.title}
        </h3>
        <p data-testid="confirm-dialog-message" className="text-sm text-muted">
          {request.message}
        </p>
        <div className="flex gap-3 pt-2">
          <Button data-testid="confirm-dialog-cancel" variant="secondary" className="flex-1" onClick={() => onAnswer(false)}>
            {request.cancelLabel}
          </Button>
          <Button
            data-testid="confirm-dialog-accept"
            variant={request.danger ? "danger" : "primary"}
            className={`flex-1 ${request.danger ? "!bg-danger !text-white !border-danger hover:!brightness-110" : ""}`}
            onClick={() => onAnswer(true)}
            autoFocus
          >
            {request.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useMemo(() => {
    const push = (variant) => (message) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { id, variant, message: String(message) }]);
    };
    return { success: push("success"), error: push("error"), info: push("info") };
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setConfirmRequest({
          title: "Konfirmasi",
          confirmLabel: "Ya, lanjutkan",
          cancelLabel: "Batal",
          danger: false,
          ...options,
          resolve,
        });
      }),
    [],
  );

  const answer = useCallback(
    (accepted) => {
      confirmRequest?.resolve(accepted);
      setConfirmRequest(null);
    },
    [confirmRequest],
  );

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:w-96"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={dismiss} />
        ))}
      </div>
      {confirmRequest && <ConfirmDialog request={confirmRequest} onAnswer={answer} />}
    </FeedbackContext.Provider>
  );
}

function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useToast/useConfirm harus dipakai di dalam FeedbackProvider");
  return context;
}

export const useToast = () => useFeedback().toast;
export const useConfirm = () => useFeedback().confirm;
