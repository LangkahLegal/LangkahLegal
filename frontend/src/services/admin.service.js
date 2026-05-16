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

// ─── Manajemen Dokumen & Chunks (RAG) ──────────────────────────────────────

/**
 * Mengambil list dokumen (UU) yang dikelompokkan (Grouped)
 * Menggunakan endpoint: GET /admin/documents/
 */
export const getAdminDocuments = async (page = 1, search = "", kategori = "") => {
  const params = { page, page_size: 20 };
  if (search) params.search = search;
  if (kategori) params.kategori = kategori;
  
  const response = await api.get("/admin/documents/", { params });
  return response.data;
};

/**
 * Mengambil isi pasal-pasal (chunks) di dalam satu UU berdasarkan URI
 * Menggunakan endpoint: GET /admin/documents/chunks
 */
export const getDocumentChunks = async (frbrUri, page = 1, pageSize = 50) => {
  const response = await api.get("/admin/documents/chunks", {
    params: { frbr_uri: frbrUri, page, page_size: pageSize },
  });
  return response.data;
};

/**
 * Mengambil detail satu chunk berdasarkan ID
 */
export const getChunkDetail = async (id) => {
  const response = await api.get(`/admin/documents/chunks/${id}`);
  return response.data;
};

/**
 * Update data chunk/pasal
 * Gunakan PATCH sesuai dokumentasi. Jika 'isi_teks' berubah, embedding akan di-update.
 */
export const updateChunk = async (id, data) => {
  const response = await api.patch(`/admin/documents/chunks/${id}`, data);
  return response.data;
};

/**
 * Menghapus satu UU utuh beserta semua pasalnya berdasarkan URI
 */
export const deleteFullDocumentByUri = async (frbrUri) => {
  const response = await api.delete("/admin/documents/by-uri", {
    params: { frbr_uri: frbrUri },
  });
  return response.data;
};

/**
 * Upload PDF Baru (Async)
 * Menggunakan FormData karena mengirim file binary
 */
export const uploadDocumentPdf = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await api.post("/admin/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // Mengembalikan { job_id, status, ... }
};

/**
 * Replace Dokumen Lama dengan PDF Baru (Async)
 */
export const replaceDocumentPdf = async (file, frbrUri) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("frbr_uri", frbrUri);
  
  const response = await api.put("/admin/documents/replace", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * Cek Status Job (Polling)
 */
export const getJobStatus = async (jobId) => {
  const response = await api.get(`/admin/documents/jobs/${jobId}`);
  return response.data;
};