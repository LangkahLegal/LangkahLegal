import api from "@/lib/axios";

/**
 * Admin Dashboard Service
 * API calls untuk fitur admin: verifikasi konsultan, monitoring komisi, stats
 */

// ─── Dashboard Stats ──────────────────────────────────────────────────────

export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

// ─── Verifikasi Konsultan ─────────────────────────────────────────────────

export const getConsultants = async (statusFilter = null) => {
  const params = statusFilter ? { status_filter: statusFilter } : {};
  const response = await api.get("/admin/consultants", { params });
  return response.data;
};

export const getConsultantDetail = async (id) => {
  const response = await api.get(`/admin/consultants/${id}`);
  return response.data;
};

export const verifyConsultant = async (id, action, alasan = null) => {
  const response = await api.patch(`/admin/consultants/${id}/verify`, {
    action,
    alasan,
  });
  return response.data;
};

// ─── Monitoring Komisi ────────────────────────────────────────────────────

export const getTransactions = async (statusFilter = null) => {
  const params = statusFilter ? { status_filter: statusFilter } : {};
  const response = await api.get("/admin/transactions", { params });
  return response.data;
};

export const getTransactionSummary = async () => {
  const response = await api.get("/admin/transactions/summary");
  return response.data;
};
