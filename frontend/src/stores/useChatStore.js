import { create } from "zustand";
import api from "@/lib/axios";

export const jamSekarang = (date = new Date()) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Field tambahan pesan Kia, dari respons /triage maupun dari metadata pesan tersimpan. */
export const aiFields = (src = {}) => ({
  type: src.type || "text",
  consultants: src.consultants || [],
  draft_konsultasi: src.draft_konsultasi || null,
  form_preferensi: src.form_preferensi || null,
  pasal_referensi: src.pasal_referensi || [],
  sumber_dokumen: src.sumber_dokumen || [],
  disclaimer: src.disclaimer || "",
});

/**
 * useChatStore — Zustand store for AI chatbot sessions.
 *
 * Manages:
 *  - activeSessionId: currently selected chat session
 *  - sessions: list of all user chat sessions
 *  - messages: messages for the active session
 *  - viewId: naik setiap kali percakapan yang tampil berganti (pindah sesi, sesi baru, sesi aktif dihapus).
 *    Request yang dimulai di view lama tidak boleh menulis ke view yang sedang tampil.
 *  - CRUD operations via backend API
 */
const useChatStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  activeSessionId: null,
  activeSourceDocument: null,
  sessions: [],
  messages: [],
  viewId: 0,
  isLoadingSessions: false,
  isLoadingMessages: false,

  setActiveSourceDocument: (source) => set({ activeSourceDocument: source }),

  // ── Session Actions ────────────────────────────────────

  /** Fetch all sessions for the current user */
  fetchSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const res = await api.get("/chatbot/sessions");
      set({ sessions: res.data.sessions || [] });
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      set({ isLoadingSessions: false });
    }
  },

  /** Create a new session and set it as active */
  createSession: async () => {
    try {
      const res = await api.post("/chatbot/sessions");
      const newSession = res.data;
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: newSession.id,
        messages: [], // blank canvas
        viewId: state.viewId + 1,
      }));
      return newSession.id;
    } catch (err) {
      console.error("Failed to create session:", err);
      return null;
    }
  },

  /** Delete a session */
  deleteSession: async (sessionId) => {
    const hapusLokal = () =>
      set((state) => {
        const wasActive = state.activeSessionId === sessionId;
        return {
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId: wasActive ? null : state.activeSessionId,
          messages: wasActive ? [] : state.messages,
          viewId: wasActive ? state.viewId + 1 : state.viewId,
        };
      });

    try {
      await api.delete(`/chatbot/sessions/${sessionId}`);
      hapusLokal();
    } catch (err) {
      // Jika session sudah tidak ada di server, hapus saja dari state lokal
      if (err.response?.status === 404) hapusLokal();
      else console.error("Failed to delete session:", err);
    }
  },

  /** Set active session and load its messages */
  setActiveSession: async (sessionId) => {
    if (sessionId === get().activeSessionId) return;

    const viewId = get().viewId + 1;
    set({
      activeSessionId: sessionId,
      activeSourceDocument: null,
      messages: [],
      viewId,
      isLoadingMessages: Boolean(sessionId),
    });
    if (!sessionId) return;

    try {
      const res = await api.get(`/chatbot/sessions/${sessionId}/messages`);
      // Klik sesi A lalu B dengan cepat: respons A yang datang belakangan tidak boleh tampil di bawah B.
      if (get().viewId !== viewId) return;
      const msgs = (res.data.messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        text: m.content,
        time: jamSekarang(new Date(m.created_at)),
        ...aiFields(m.metadata || {}),
      }));
      set({ messages: msgs });
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      if (get().viewId === viewId) set({ isLoadingMessages: false });
    }
  },

  /** Start a new blank conversation (no session created yet — lazy) */
  startNewChat: () => {
    set((state) => ({
      activeSessionId: null,
      messages: [],
      activeSourceDocument: null,
      viewId: state.viewId + 1,
      isLoadingMessages: false,
    }));
  },

  // ── Message Actions ────────────────────────────────────

  /** Add a message to the local state (optimistic) */
  addLocalMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  updateLocalMessage: (id, patch) => {
    set((state) => ({ messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  },

  removeLocalMessages: (ids) => {
    set((state) => ({ messages: state.messages.filter((m) => !ids.includes(m.id)) }));
  },

  /** Update session title in local state (after auto-generate) */
  updateSessionTitle: (sessionId, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      ),
    }));
  },

  /** Move a session to the top of the list (most recent) */
  bumpSession: (sessionId) => {
    set((state) => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return state;
      return {
        sessions: [
          { ...session, updated_at: new Date().toISOString() },
          ...state.sessions.filter((s) => s.id !== sessionId),
        ],
      };
    });
  },
}));

export default useChatStore;
