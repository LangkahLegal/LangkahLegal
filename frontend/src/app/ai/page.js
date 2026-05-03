"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ChatHeader from "@/components/ai/ChatHeader";
import ChatMessage from "@/components/ai/ChatMessage";
import ChatInput from "@/components/ai/ChatInput";
import { MaterialIcon } from "@/components/ui/Icons";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function TanyaAIPage() {
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Halo! Saya Kia, asisten hukum pintar Anda. Saat ini saya telah mempelajari ribuan dokumen hukum dan dapat membantu Anda dalam topik berikut:\n\n- **Hukum Pidana:** KUHP, KUHAP, UU Narkotika, UU Antikorupsi, UU Pencucian Uang (TPPU), dll.\n- **Hukum Perdata:** KUH Perdata, UU Perkawinan, Kompilasi Hukum Islam (KHI), UU Pokok Agraria, UU Perlindungan Konsumen, dll.\n- **Ketenagakerjaan:** UU Ketenagakerjaan, UU Cipta Kerja, Aturan BPJS, Panduan Pesangon & PHK, dll.\n- **Teknologi Informasi:** UU ITE, UU Perlindungan Data Pribadi (PDP), UU Pers.\n- **Hak Asasi Manusia:** UU TPKS (Kekerasan Seksual), UU PKDRT, UU Perlindungan Anak, dll.\n- **Hukum Umum:** UU Advokat, UU Bantuan Hukum, UU Kepolisian, Pelayanan Publik, dll.\n\nCeritakan masalah yang Anda hadapi secara detail, dan saya akan carikan pasal yang relevan serta menjelaskannya dengan bahasa yang mudah dipahami! 💡",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userQuery = input.trim();
    const userMsg = {
      id: Date.now(),
      role: "user",
      text: userQuery,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Build chat history from previous messages (last 6, excluding system/initial)
      const recentHistory = messages
        .filter((m) => m.id !== 1) // exclude initial greeting
        .slice(-6)
        .map((m) => ({
          role: m.role === "ai" ? "ai" : "user",
          text: m.text.slice(0, 500), // truncate for payload size
        }));

      const response = await fetch(`${BACKEND_URL}/api/v1/chatbot/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          kategori: null,
          session_id: null,
          chat_history: recentHistory.length > 0 ? recentHistory : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: data.jawaban,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        pasal_referensi: data.pasal_referensi || [],
        disclaimer: data.disclaimer || "",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chatbot error:", error);

      const errorMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi dalam beberapa saat.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#e8e2fc] -> text-main */
    <div className="bg-bg text-main h-screen flex overflow-hidden transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <ChatHeader name="Kia" avatarUrl="/images/visi.png" status="Online" />

        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth"
        >
          <div className="max-w-5xl mx-auto w-full space-y-8">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="flex justify-start items-center gap-3 animate-pulse">
                {/* REFACTOR: bg-[#1f1d35] -> bg-input | border-white/10 -> border-surface */}
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-input flex items-center justify-center border border-surface shrink-0 shadow-soft">
                  {/* REFACTOR: text-[#ada3ff] -> text-primary-light */}
                  <MaterialIcon
                    name="smart_toy"
                    className="text-primary-light text-sm"
                  />
                </div>
                {/* REFACTOR: bg-[#e8e2fc]/10 -> bg-main/10 */}
                <div className="bg-main/10 px-6 py-4 rounded-full flex gap-1.5 items-center border border-surface">
                  {/* REFACTOR: bg-[#ada3ff] -> bg-primary-light */}
                  <div className="w-1.5 h-1.5 bg-primary-light rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary-light rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary-light rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
        </main>

        <ChatInput input={input} setInput={setInput} onSend={handleSend} />

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}