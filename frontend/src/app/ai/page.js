"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ChatHeader from "@/components/ai/ChatHeader";
import ChatMessage from "@/components/ai/ChatMessage";
import ChatInput from "@/components/ai/ChatInput";
import ChatSidebar from "@/components/ai/ChatSidebar";
import { MaterialIcon } from "@/components/ui/Icons";
import useChatStore from "@/stores/useChatStore";
import api from "@/lib/axios";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "ai",
  text: "Halo! Saya Kia, asisten hukum pintar Anda. Saat ini saya telah mempelajari ribuan dokumen hukum dan dapat membantu Anda dalam topik berikut:\n\n- **Hukum Pidana:** KUHP, KUHAP, UU Narkotika, UU Antikorupsi, UU Pencucian Uang (TPPU), dll.\n- **Hukum Perdata:** KUH Perdata, UU Perkawinan, Kompilasi Hukum Islam (KHI), UU Pokok Agraria, UU Perlindungan Konsumen, dll.\n- **Ketenagakerjaan:** UU Ketenagakerjaan, UU Cipta Kerja, Aturan BPJS, Panduan Pesangon & PHK, dll.\n- **Teknologi Informasi:** UU ITE, UU Perlindungan Data Pribadi (PDP), UU Pers.\n- **Hak Asasi Manusia:** UU TPKS (Kekerasan Seksual), UU PKDRT, UU Perlindungan Anak, dll.\n- **Hukum Umum:** UU Advokat, UU Bantuan Hukum, UU Kepolisian, Pelayanan Publik, dll.\n\nCeritakan masalah yang Anda hadapi secara detail, dan saya akan carikan pasal yang relevan serta menjelaskannya dengan bahasa yang mudah dipahami! 💡",
  time: "Baru saja",
};

export default function TanyaAIPage() {
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const {
    activeSessionId,
    messages,
    isLoadingMessages,
    addLocalMessage,
    fetchSessions,
    updateSessionTitle,
    bumpSession,
  } = useChatStore();

  const loadingTexts = [
    "Kia sedang membaca kronologi Anda...",
    "Menganalisis konteks hukum yang relevan...",
    "Mencocokkan dengan pasal di database...",
    "Menyiapkan tanggapan hukum terbaik...",
  ];
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(
    () => {
      let interval;
      if (isTyping) {
        setLoadingStep(0);
        interval = setInterval(() => {
          setLoadingStep((prev) => (prev + 1) % loadingTexts.length);
        }, 2000);
      } else {
        setLoadingStep(0);
      }
      return () => clearInterval(interval);
    },
    [isTyping],
    loadingTexts.length,
  );

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Build display messages: welcome + stored messages
  const displayMessages = messages.length > 0 ? messages : [WELCOME_MESSAGE];

  // Quick Replies Logic
  const lastMessage = displayMessages[displayMessages.length - 1];
  let suggestedActions = [];
  if (!isTyping && lastMessage && lastMessage.role === "ai") {
    const textLower = lastMessage.text.toLowerCase();
    if (
      textLower.includes("mencarikan konsultan") ||
      textLower.includes("butuh konsultan") ||
      textLower.includes("carikan pengacara") ||
      textLower.includes("rekomendasi konsultan")
    ) {
      suggestedActions = [
        "Ya, tolong carikan konsultan",
        "Belum perlu, terima kasih",
      ];
    } else if (textLower.includes("bukti") || textLower.includes("dokumen")) {
      suggestedActions = ["Ya, saya punya buktinya", "Saya tidak punya bukti"];
    }
  }

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === "string" ? overrideText : input;
    if (!textToSend.trim() || isTyping) return;

    const userQuery = textToSend.trim();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Optimistic: add user message to UI
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userQuery,
      time: timeStr,
    };
    addLocalMessage(userMsg);
    setInput("");
    setIsTyping(true);

    try {
      // Call triage endpoint — backend handles session creation + history
      const res = await api.post("/chatbot/triage", {
        query: userQuery,
        session_id: activeSessionId || null,
        kategori: null,
      });

      const data = res.data;

      // If this was a new session, update the store
      if (!activeSessionId && data.session_id) {
        useChatStore.setState({ activeSessionId: data.session_id });

        // Refresh sessions list to show the new session with auto-generated title
        setTimeout(() => {
          fetchSessions();
        }, 2000); // Wait for auto-title generation
      } else if (data.session_id) {
        bumpSession(data.session_id);
      }

      // Add AI response to UI
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: data.jawaban,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: data.type || "text",
        consultants: data.consultants || [],
        pasal_referensi: data.pasal_referensi || [],
        disclaimer: data.disclaimer || "",
      };
      addLocalMessage(aiMsg);
    } catch (error) {
      console.error("Chatbot error:", error);

      let errorDesc =
        "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi dalam beberapa saat.";
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorDesc =
            "Sesi Anda telah habis. Silakan login terlebih dahulu untuk menggunakan fitur Tanya AI.";
        } else if (status === 429) {
          errorDesc =
            "Maaf, server AI sedang melayani terlalu banyak permintaan. Mohon tunggu beberapa saat sebelum mencoba lagi.";
        } else if (status === 500) {
          errorDesc =
            "Waduh, terjadi kendala pada sistem internal kami (mungkin server AI atau database sedang sibuk). Tim teknis kami akan segera memeriksanya!";
        } else if (status === 404) {
          errorDesc = "Maaf, fitur ini sedang tidak dapat diakses (Not Found).";
        } else if (status === 307 || status === 308) {
          errorDesc =
            "Terjadi pengalihan jaringan. Silakan coba kirim ulang pesan Anda.";
        } else {
          errorDesc = `Maaf, terjadi kesalahan (Kode: ${status}). Silakan coba lagi nanti.`;
        }
      } else if (error.request) {
        errorDesc =
          "Koneksi terputus. Kia tidak bisa terhubung ke server. Pastikan internet Anda stabil ya!";
      }

      const errorMsg = {
        id: `error-${Date.now()}`,
        role: "ai",
        text: errorDesc,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
      };
      addLocalMessage(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className="bg-bg text-main h-screen flex overflow-hidden transition-colors duration-500"
      data-testid="ai-chat-page"
    >
      {/* Main navigation sidebar */}
      <Sidebar />

      {/* AI Chat Sidebar — overlay on ALL screen sizes, toggled via button */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed top-0 h-full w-72 bg-bg z-50 border-r border-surface shadow-2xl left-0 lg:left-64 animate-in slide-in-from-left duration-300">
            <ChatSidebar />
          </div>
        </>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <ChatHeader
          name="Visi"
          status="Online"
          onToggleSidebar={() => setShowSidebar((p) => !p)}
          showSidebarToggle
        />

        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth"
          data-testid="ai-chat-messages"
        >
          <div className="max-w-5xl mx-auto w-full space-y-8">
            {/* Loading state when switching sessions */}
            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-3 border-primary-light/30 border-t-primary-light rounded-full animate-spin" />
                <p className="text-sm text-muted">Memuat riwayat chat...</p>
              </div>
            ) : (
              displayMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))
            )}

            {isTyping && (
              <div className="flex justify-start items-center gap-3 animate-pulse">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-input flex items-center justify-center border border-surface shrink-0 shadow-soft">
                  <MaterialIcon
                    name="smart_toy"
                    className="text-primary-light text-sm"
                  />
                </div>
                <div className="bg-surface/60 border border-surface px-5 py-3 rounded-[2rem] rounded-bl-none flex gap-3 items-center shadow-soft">
                  <div className="w-4 h-4 border-2 border-primary-light/30 border-t-primary-light rounded-full animate-spin shrink-0" />
                  <p className="text-xs lg:text-sm font-medium text-main">
                    {loadingTexts[loadingStep]}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSend()}
          suggestedActions={suggestedActions}
          onActionClick={handleSend}
        />

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
