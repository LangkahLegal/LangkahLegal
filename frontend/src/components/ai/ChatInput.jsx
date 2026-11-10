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
    <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-5 pt-2 bg-gradient-to-t from-bg via-bg to-transparent flex flex-col gap-2 shrink-0">
      <div className="max-w-4xl mx-auto w-full">
        {/* Suggested Actions (Quick Replies) */}
        {suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
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
            placeholder="Tulis pertanyaan hukum Anda... (Shift+Enter untuk baris baru)"
            data-testid="ai-chat-input"
            className="flex-1 bg-transparent border-none outline-none text-main text-sm placeholder:text-muted/40 placeholder:truncate py-2 px-3 resize-none min-h-[40px] max-h-[140px] overflow-y-auto"
            rows={1}
          />

          {/* Tombol Kirim */}
          <Button
            type="submit"
            variant={input.trim() ? "primary" : "secondary"}
            disabled={!input.trim()}
            className={`
              !w-9 !h-9 sm:!w-10 sm:!h-10 !rounded-full !p-0 transition-all duration-300 shrink-0
              ${input.trim() ? "shadow-soft scale-100" : "opacity-40 scale-90"}
            `}
          >
            <MaterialIcon
              name="send"
              className={`
                text-lg sm:text-xl transition-all duration-300
                ${input.trim() ? "rotate-[-45deg] translate-x-0.5" : "rotate-0"}
              `}
            />
          </Button>
        </form>
      </div>
    </div>
  );
}
