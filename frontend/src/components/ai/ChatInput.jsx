"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export default function ChatInput({ input, setInput, onSend }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) onSend();
  };

  return (
    /* Container dengan gradient theme-aware agar teks chat di belakangnya menghilang halus */
    <div className="px-6 pb-28 lg:pb-10 pt-4 bg-gradient-to-t from-bg via-bg to-transparent">
      <div className="max-w-5xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className={`
            bg-input rounded-[2rem] border border-surface p-2 lg:p-3 
            flex items-center gap-2 shadow-soft 
            focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 
            transition-all duration-300
          `}
        >
          {/* Input Area: Menggunakan text-main dan placeholder muted */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pertanyaan hukum Anda..."
            className="flex-1 bg-transparent border-none outline-none text-main text-sm lg:text-base placeholder:text-muted/40 py-3 px-3"
          />

          {/* Tombol Kirim: Menggunakan DNA komponen Button Anda */}
          <Button
            type="submit"
            variant={input.trim() ? "primary" : "secondary"}
            disabled={!input.trim()}
            className={`
              !w-12 !h-12 lg:!w-14 lg:!h-14 !rounded-full !p-0 transition-all duration-500
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
