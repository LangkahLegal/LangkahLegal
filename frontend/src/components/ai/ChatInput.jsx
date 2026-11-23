"use client";

import React, { useRef, useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

// Sama dengan validasi backend (TriageRequest.query).
export const MIN_PESAN = 3;
export const MAX_PESAN = 2000;
const TAMPILKAN_HITUNGAN = 1800;

/**
 * Teks yang sedang diketik disimpan di sini, bukan di halaman, supaya setiap ketikan tidak me-render ulang
 * seluruh percakapan. `onSend(teks)` mengembalikan false kalau pesan tidak jadi dikirim, dan teks tidak dihapus.
 */
export default function ChatInput({ onSend, busy = false, suggestedActions = [], onActionClick }) {
  const textareaRef = useRef(null);
  const [input, setInput] = useState("");
  const panjang = input.trim().length;
  const bisaKirim = panjang >= MIN_PESAN && !busy;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (bisaKirim && onSend(input) !== false) setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    /* Container dengan gradient theme-aware agar teks chat di belakangnya menghilang halus */
    <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-5 pt-2 bg-gradient-to-t from-bg via-bg to-transparent flex flex-col gap-2 shrink-0">
      <div className="max-w-4xl mx-auto w-full">
        {/* Suggested Actions (Quick Replies) */}
        {suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onActionClick(action)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-surface/50 border border-surface text-primary-light hover:bg-primary/10 hover:border-primary/30 transition-colors animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`
            bg-input rounded-2xl border border-surface p-1.5 sm:p-2
            flex items-end gap-2 shadow-soft
            focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5
            transition-all duration-300
          `}
        >
          {/* Input Area: Textarea auto-resize */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_PESAN}
            placeholder="Tulis pertanyaan hukum Anda... (Shift+Enter untuk baris baru)"
            aria-label="Pesan untuk Kia"
            aria-describedby="ai-chat-input-hint"
            data-testid="ai-chat-input"
            className="flex-1 bg-transparent border-none outline-none text-main text-sm placeholder:text-muted/40 placeholder:truncate py-2 px-3 resize-none min-h-[40px] max-h-[140px] overflow-y-auto"
            rows={1}
          />

          {/* Tombol Kirim */}
          <Button
            type="submit"
            variant={bisaKirim ? "primary" : "secondary"}
            disabled={!bisaKirim}
            aria-label="Kirim pesan"
            className={`
              !w-9 !h-9 sm:!w-10 sm:!h-10 !rounded-full !p-0 transition-all duration-300 shrink-0
              ${bisaKirim ? "shadow-soft scale-100" : "opacity-40 scale-90"}
            `}
          >
            <MaterialIcon
              name="send"
              className={`
                text-lg sm:text-xl transition-all duration-300
                ${bisaKirim ? "rotate-[-45deg] translate-x-0.5" : "rotate-0"}
              `}
            />
          </Button>
        </form>

        <p id="ai-chat-input-hint" className="min-h-[1rem] px-3 pt-1 text-[10px] text-muted" aria-live="polite">
          {panjang > 0 && panjang < MIN_PESAN && `Pesan minimal ${MIN_PESAN} karakter.`}
          {input.length >= TAMPILKAN_HITUNGAN &&
            `${input.length.toLocaleString("id-ID")}/${MAX_PESAN.toLocaleString("id-ID")} karakter`}
        </p>
      </div>
    </div>
  );
}
