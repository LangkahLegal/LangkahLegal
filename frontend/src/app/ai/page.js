"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useShallow } from "zustand/react/shallow";
import AppShell from "@/components/layout/AppShell";
import BottomNav from "@/components/layout/BottomNav";
import ChatHeader from "@/components/ai/ChatHeader";
import ChatMessage from "@/components/ai/ChatMessage";
import ChatInput, { MAX_PESAN, MIN_PESAN } from "@/components/ai/ChatInput";
import ChatSidebar from "@/components/ai/ChatSidebar";
import SourceDocumentModal from "@/components/ai/SourceDocumentModal";
import useChatStore, { aiFields, jamSekarang } from "@/stores/useChatStore";
import api from "@/lib/axios";
import { useSidebarCollapsed } from "@/lib/sidebarState";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "ai",
  text: "Halo! Saya Kia, asisten hukum pintar Anda. Saat ini saya telah mempelajari ribuan dokumen hukum dan dapat membantu Anda dalam topik berikut:\n\n- **Hukum Pidana:** KUHP, KUHAP, UU Narkotika, UU Antikorupsi, UU Pencucian Uang (TPPU), dll.\n- **Hukum Perdata:** KUH Perdata, UU Perkawinan, Kompilasi Hukum Islam (KHI), UU Pokok Agraria, UU Perlindungan Konsumen, dll.\n- **Ketenagakerjaan:** UU Ketenagakerjaan, UU Cipta Kerja, Aturan BPJS, Panduan Pesangon & PHK, dll.\n- **Teknologi Informasi:** UU ITE, UU Perlindungan Data Pribadi (PDP), UU Pers.\n- **Hak Asasi Manusia:** UU TPKS (Kekerasan Seksual), UU PKDRT, UU Perlindungan Anak, dll.\n- **Hukum Umum:** UU Advokat, UU Bantuan Hukum, UU Kepolisian, Pelayanan Publik, dll.\n\nCeritakan masalah yang Anda hadapi secara detail, dan saya akan carikan pasal yang relevan serta menjelaskannya dengan bahasa yang mudah dipahami! 💡",
  time: "Baru saja",
};

const LOADING_TEXTS = [
  "Kia sedang membaca kronologi Anda...",
  "Menganalisis konteks hukum yang relevan...",
  "Mencocokkan dengan pasal di database...",
  "Menyiapkan tanggapan hukum terbaik...",
];

function pesanGalat(error) {
  if (!error.response) {
    return error.request
      ? "Koneksi terputus. Kia tidak bisa terhubung ke server. Pastikan internet Anda stabil ya!"
      : "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi dalam beberapa saat.";
  }
  const status = error.response.status;
  if (status === 401) {
    return "Sesi Anda telah habis. Silakan login terlebih dahulu untuk menggunakan fitur Tanya AI.";
  }
  if (status === 422) {
    return `Pesan harus berisi ${MIN_PESAN} sampai ${MAX_PESAN.toLocaleString("id-ID")} karakter. Silakan ubah pesan Anda lalu kirim lagi.`;
  }
  if (status === 429) {
    return "Maaf, server AI sedang melayani terlalu banyak permintaan. Mohon tunggu beberapa saat sebelum mencoba lagi.";
  }
  if (status === 500) {
    return "Waduh, terjadi kendala pada sistem internal kami (mungkin server AI atau database sedang sibuk). Tim teknis kami akan segera memeriksanya!";
  }
  if (status === 404) return "Maaf, fitur ini sedang tidak dapat diakses (Not Found).";
  if (status === 307 || status === 308) return "Terjadi pengalihan jaringan. Silakan coba kirim ulang pesan Anda.";
  return `Maaf, terjadi kesalahan (Kode: ${status}). Silakan coba lagi nanti.`;
}

/** Indikator "Kia sedang mengetik" dengan teks berganti tiap 2 detik. Dipisah supaya pergantian teksnya tidak
 * me-render ulang seluruh percakapan. */
function TypingIndicator() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep((prev) => (prev + 1) % LOADING_TEXTS.length), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start items-center gap-3 animate-pulse" role="status">
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-on-header/95 border border-surface shrink-0 shadow-soft">
        <Image src="/images/statue.png" alt="Kia" fill sizes="32px" className="object-contain pt-0.5 px-0.5" />
      </div>
      <div className="bg-surface/60 border border-surface px-5 py-3 rounded-[2rem] rounded-bl-none flex gap-3 items-center shadow-soft">
        <div className="w-4 h-4 border-2 border-primary-light/30 border-t-primary-light rounded-full animate-spin shrink-0" />
        <p className="text-xs lg:text-sm font-medium text-main">{LOADING_TEXTS[step]}</p>
      </div>
    </div>
  );
}

export default function TanyaAIPage() {
  const scrollRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const { isCollapsed } = useSidebarCollapsed();

  const {
    viewId,
    messages,
    isLoadingMessages,
    addLocalMessage,
    updateLocalMessage,
    removeLocalMessages,
    fetchSessions,
    bumpSession,
    activeSourceDocument,
    setActiveSourceDocument,
  } = useChatStore(
    useShallow((s) => ({
      viewId: s.viewId,
      messages: s.messages,
      isLoadingMessages: s.isLoadingMessages,
      addLocalMessage: s.addLocalMessage,
      updateLocalMessage: s.updateLocalMessage,
      removeLocalMessages: s.removeLocalMessages,
      fetchSessions: s.fetchSessions,
      bumpSession: s.bumpSession,
      activeSourceDocument: s.activeSourceDocument,
      setActiveSourceDocument: s.setActiveSourceDocument,
    })),
  );

  // View (percakapan yang tampil) yang sedang menunggu balasan. Pindah ke sesi lain tidak terkunci oleh request
  // di sesi sebelumnya, dan balasannya tidak ikut tampil di sesi baru.
  const pendingRef = useRef(new Set());
  const [pendingViews, setPendingViews] = useState([]);
  const isTyping = pendingViews.includes(viewId);

  const tandaiPending = useCallback((id, aktif) => {
    if (aktif) pendingRef.current.add(id);
    else pendingRef.current.delete(id);
    setPendingViews([...pendingRef.current]);
  }, []);

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

  // Pesan gagal dan balasan errornya tidak dihitung, supaya form budget/jadwal tetap aktif setelah gagal dikirim.
  const terjawab = displayMessages.filter((m) => !m.isError && !m.failed);
  const terakhir = terjawab[terjawab.length - 1];
  const idFormAktif = !isTyping && terakhir?.type === "tanya_preferensi" ? terakhir.id : null;

  // Quick Replies Logic
  const lastMessage = displayMessages[displayMessages.length - 1];
  let suggestedActions = [];
  // Saat Kia menanyakan budget/jadwal, jawabannya lewat form; saran teks tidak ditampilkan.
  if (!isTyping && lastMessage && lastMessage.role === "ai" && !lastMessage.isError && lastMessage.type !== "tanya_preferensi") {
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
      // suggestedActions = ["Ya, saya punya buktinya", "Saya tidak punya bukti"];
    }
  }

  const tampilkanGagal = useCallback(
    (userMsg, teks, preferensi) => {
      updateLocalMessage(userMsg.id, { failed: true });
      addLocalMessage({
        id: `error-${Date.now()}`,
        role: "ai",
        text: teks,
        time: jamSekarang(),
        isError: true,
        retry: { text: userMsg.text, preferensi, userMsgId: userMsg.id },
      });
    },
    [addLocalMessage, updateLocalMessage],
  );

  /**
   * Kirim pesan ke Kia. Mengembalikan false kalau pesan ditolak (kosong, terlalu pendek/panjang, atau masih
   * menunggu balasan di percakapan ini). `preferensi` diisi saat klien mengirim form budget/jadwal.
   */
  const handleSend = useCallback(
    (text, preferensi = null) => {
      const userQuery = (text || "").trim();
      const { viewId: viewAwal, activeSessionId } = useChatStore.getState();
      if (userQuery.length < MIN_PESAN || userQuery.length > MAX_PESAN || pendingRef.current.has(viewAwal)) {
        return false;
      }

      // Optimistic: add user message to UI
      const userMsg = { id: `user-${Date.now()}`, role: "user", text: userQuery, time: jamSekarang() };
      addLocalMessage(userMsg);
      tandaiPending(viewAwal, true);

      (async () => {
        try {
          // Call triage endpoint — backend handles session creation + history
          const res = await api.post("/chatbot/triage", {
            query: userQuery,
            session_id: activeSessionId || null,
            kategori: null,
            ...(preferensi ? { preferensi } : {}),
          });
          const data = res.data;
          const masihTampil = useChatStore.getState().viewId === viewAwal;

          if (data.session_id && !activeSessionId) {
            // Sesi baru: judulnya sudah disimpan backend sebelum respons dikirim.
            if (masihTampil) useChatStore.setState({ activeSessionId: data.session_id });
            fetchSessions();
          } else if (data.session_id) {
            bumpSession(data.session_id);
          }

          // Klien sudah pindah percakapan: balasan tersimpan di sesinya sendiri dan muncul saat sesi itu dibuka.
          if (!masihTampil) return;
          if (data.type === "error") {
            tampilkanGagal(userMsg, data.jawaban, preferensi);
            return;
          }
          addLocalMessage({
            id: `ai-${Date.now()}`,
            role: "ai",
            text: data.jawaban,
            time: jamSekarang(),
            ...aiFields(data),
          });
        } catch (error) {
          console.error("Chatbot error:", error);
          if (useChatStore.getState().viewId === viewAwal) tampilkanGagal(userMsg, pesanGalat(error), preferensi);
        } finally {
          tandaiPending(viewAwal, false);
        }
      })();
      return true;
    },
    [addLocalMessage, bumpSession, fetchSessions, tampilkanGagal, tandaiPending],
  );

  const handleRetry = useCallback(
    (errorMsg) => {
      const { text, preferensi, userMsgId } = errorMsg.retry;
      if (handleSend(text, preferensi)) removeLocalMessages([errorMsg.id, userMsgId]);
    },
    [handleSend, removeLocalMessages],
  );

  const handleSubmitPreferensi = useCallback(
    (preferensi, ringkasan) => handleSend(ringkasan, preferensi),
    [handleSend],
  );

  return (
    <AppShell
      role="client"
      testId="ai-chat-page"
      className="h-screen overflow-hidden"
      contentDirection="row"
      contentClassName="h-full overflow-hidden"
      hideBottomNav
      overlay={
        showSidebar && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSidebar(false)}
            />
            <div
              className={`fixed top-0 h-full w-72 bg-bg z-50 border-r border-surface shadow-2xl left-0 ${isCollapsed ? "lg:left-20" : "lg:left-60"
                } animate-in slide-in-from-left duration-300`}
            >
              <ChatSidebar />
            </div>
          </>
        )
      }
    >
      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300">
        <ChatHeader
          name="Kia"
          status="Online"
          onToggleSidebar={() => setShowSidebar((p) => !p)}
          showSidebarToggle
        />

        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-5 pb-28 lg:pb-8 scroll-smooth"
          data-testid="ai-chat-messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-busy={isLoadingMessages}
          aria-label="Percakapan dengan Kia"
        >
          <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in">
            {/* Loading state when switching sessions */}
            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5">
                <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                  Memuat Riwayat Chat...
                </p>
              </div>
            ) : (
              displayMessages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  formAktif={msg.id === idFormAktif}
                  onSubmitPreferensi={handleSubmitPreferensi}
                  onRetry={handleRetry}
                />
              ))
            )}

            {isTyping && <TypingIndicator />}
          </div>
        </main>

        <ChatInput
          onSend={handleSend}
          busy={isTyping}
          suggestedActions={suggestedActions}
          onActionClick={handleSend}
        />

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>

      {/* Side-by-side Document Workspace (Canvas style, docked to the right of chat) */}
      {activeSourceDocument && (
        <aside
          className="w-full absolute md:relative inset-0 md:inset-auto md:w-[360px] lg:w-[380px] xl:w-[440px] 2xl:w-[480px] shrink-0 h-full border-l border-surface bg-bg flex flex-col z-30 transition-all duration-300 animate-in slide-in-from-right"
          data-testid="ai-source-modal"
        >
          <SourceDocumentModal
            source={activeSourceDocument}
            onClose={() => setActiveSourceDocument(null)}
          />
        </aside>
      )}
    </AppShell>
  );
}
