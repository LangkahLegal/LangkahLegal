"use client";

import React, { useRef, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export default function ChatInput({ input, setInput, onSend, suggestedActions = [], onActionClick }) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (input.trim()) onSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    /* Container dengan gradient theme-aware agar teks chat di belakangnya menghilang halus */
    <div className="px-6 pb-28 lg:pb-10 pt-4 bg-gradient-to-t from-bg via-bg to-transparent flex flex-col gap-3">
      <div className="max-w-5xl mx-auto w-full">
        {/* Suggested Actions (Quick Replies) */}
        {suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onActionClick(action)}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-surface/50 border border-surface text-primary-light hover:bg-primary/10 hover:border-primary/30 transition-colors animate-in fade-in slide-in-from-bottom-2"
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
            bg-input rounded-3xl border border-surface p-2 lg:p-3 
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
            placeholder="Tulis pertanyaan hukum Anda... (Shift+Enter untuk baris baru)"
            data-testid="ai-chat-input"
            className="flex-1 bg-transparent border-none outline-none text-main text-sm lg:text-base placeholder:text-muted/40 py-3 px-4 resize-none min-h-[48px] max-h-[150px] overflow-y-auto"
            rows={1}
          />

          {/* Tombol Kirim */}
          <Button
            type="submit"
            variant={input.trim() ? "primary" : "secondary"}
            disabled={!input.trim()}
            className={`
              !w-12 !h-12 lg:!w-14 lg:!h-14 !rounded-full !p-0 transition-all duration-500 shrink-0
              ${input.trim() ? "shadow-soft scale-100" : "opacity-40 scale-90"}
            `}
          >
            <MaterialIcon
              name="send"
              className={`
                text-2xl transition-all duration-500
                ${input.trim() ? "rotate-[-45deg] translate-x-0.5" : "rotate-0"}
              `}
            />
          </Button>
        </form>
      </div>
    </div>
  );
}
