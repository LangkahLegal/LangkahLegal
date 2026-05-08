import { create } from "zustand";
import api from "@/lib/axios";

/**
 * useChatStore — Zustand store for AI chatbot sessions.
 *
 * Manages:
 *  - activeSessionId: currently selected chat session
 *  - sessions: list of all user chat sessions
 *  - messages: messages for the active session
 *  - CRUD operations via backend API
 */
const useChatStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  activeSessionId: null,
  sessions: [],
  messages: [],
  isLoadingSessions: false,
  isLoadingMessages: false,

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
      }));
      return newSession.id;
    } catch (err) {
      console.error("Failed to create session:", err);
      return null;
    }
  },

  /** Delete a session */
  deleteSession: async (sessionId) => {
    try {
      await api.delete(`/chatbot/sessions/${sessionId}`);
      set((state) => {
        const filtered = state.sessions.filter((s) => s.id !== sessionId);
        const wasActive = state.activeSessionId === sessionId;
        return {
          sessions: filtered,
          activeSessionId: wasActive ? null : state.activeSessionId,
          messages: wasActive ? [] : state.messages,
        };
      });
    } catch (err) {
      if (err.response?.status === 404) {
        // Jika session sudah tidak ada di server, hapus saja dari state lokal
        set((state) => {
          const filtered = state.sessions.filter((s) => s.id !== sessionId);
          const wasActive = state.activeSessionId === sessionId;
          return {
            sessions: filtered,
            activeSessionId: wasActive ? null : state.activeSessionId,
            messages: wasActive ? [] : state.messages,
          };
        });
      } else {
        console.error("Failed to delete session:", err);
      }
    }
  },

  /** Set active session and load its messages */
  setActiveSession: async (sessionId) => {
    if (sessionId === get().activeSessionId) return;

    set({ activeSessionId: sessionId, messages: [], isLoadingMessages: true });

    if (!sessionId) {
      set({ isLoadingMessages: false });
      return;
    }

    try {
      const res = await api.get(`/chatbot/sessions/${sessionId}/messages`);
      const msgs = (res.data.messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: m.metadata?.type || "text",
        consultants: m.metadata?.consultants || [],
        pasal_referensi: m.metadata?.pasal_referensi || [],
        disclaimer: m.metadata?.disclaimer || "",
      }));
      set({ messages: msgs });
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  /** Start a new blank conversation (no session created yet — lazy) */
  startNewChat: () => {
    set({ activeSessionId: null, messages: [] });
  },

  // ── Message Actions ────────────────────────────────────

  /** Add a message to the local state (optimistic) */
  addLocalMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
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
