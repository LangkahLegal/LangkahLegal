"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import useChatStore from "@/stores/useChatStore";

/**
 * ChatSidebar — Sidebar panel for AI chat sessions (like ChatGPT sidebar).
 * Shows list of past sessions, allows switching, creating new, and deleting.
 * This is rendered INSIDE the chat page, alongside the main navigation Sidebar.
 */
export default function ChatSidebar() {
  const {
    sessions,
    activeSessionId,
    isLoadingSessions,
    fetchSessions,
    setActiveSession,
    startNewChat,
    deleteSession,
  } = useChatStore();

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (deleteConfirm === sessionId) {
      await deleteSession(sessionId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(sessionId);
      // Auto-cancel after 3s
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return "Baru saja";
    if (diffHours < 24) return `${Math.floor(diffHours)} jam lalu`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 border-b border-surface">
        <button
          onClick={startNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary-light transition-all duration-300 group"
        >
          <MaterialIcon
            name="add_circle"
            className="text-xl group-hover:rotate-90 transition-transform duration-300"
          />
          <span className="font-semibold text-sm">Konsultasi Baru</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {isLoadingSessions ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-5 h-5 border-2 border-primary-light/30 border-t-primary-light rounded-full animate-spin" />
            <p className="text-xs text-muted">Memuat riwayat...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MaterialIcon name="chat_bubble_outline" className="text-3xl text-muted/40 mb-2" />
            <p className="text-xs text-muted/60">
              Belum ada riwayat konsultasi. Mulai dengan mengetik pertanyaan!
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isDeleting = deleteConfirm === session.id;

            return (
              <div
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-surface border border-transparent"
                }`}
              >
                <MaterialIcon
                  name={isActive ? "chat" : "chat_bubble_outline"}
                  className={`text-lg shrink-0 ${
                    isActive ? "text-primary-light" : "text-muted/50"
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${
                      isActive ? "text-main font-semibold" : "text-main/80"
                    }`}
                  >
                    {session.title}
                  </p>
                  <p className="text-[10px] text-muted/50 truncate">
                    {formatDate(session.updated_at)}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className={`shrink-0 p-1 rounded-md transition-all duration-200 ${
                    isDeleting
                      ? "bg-red-500/20 text-red-400"
                      : "opacity-0 group-hover:opacity-100 text-muted/40 hover:text-red-400 hover:bg-red-500/10"
                  }`}
                  title={isDeleting ? "Klik lagi untuk hapus" : "Hapus sesi"}
                >
                  <MaterialIcon
                    name={isDeleting ? "delete_forever" : "close"}
                    className="text-sm"
                  />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Session count */}
      {sessions.length > 0 && (
        <div className="px-4 py-2 border-t border-surface">
          <p className="text-[10px] text-muted/40 text-center">
            {sessions.length} sesi konsultasi
          </p>
        </div>
      )}
    </div>
  );
}
