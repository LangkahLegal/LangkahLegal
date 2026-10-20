// Membawa ringkasan kasus dari Tanya AI ke form pengajuan di halaman konsultan.
// Pakai localStorage, bukan sessionStorage, karena kartu konsultan membuka tab baru.
const DRAFT_KEY = "ll_consultation_draft";
const DRAFT_MAX_AGE_MS = 60 * 60 * 1000;

export const saveConsultationDraft = (draft) => {
  if (!draft?.deskripsi_kasus) return;
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ deskripsi_kasus: draft.deskripsi_kasus, savedAt: Date.now() }),
    );
  } catch {
    // Penyimpanan diblokir browser: form tetap bisa diisi manual.
  }
};

/**
 * Deskripsi kasus dari Tanya AI, hanya bila halaman dibuka lewat kartu konsultan AI (`?dari=ai`).
 * Tidak mengubah apa pun, sehingga aman dipakai dengan `useClientValue`.
 */
export const readIncomingConsultationDraft = () => {
  try {
    if (new URLSearchParams(window.location.search).get("dari") !== "ai") return null;
    const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY));
    if (!draft?.deskripsi_kasus || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) return null;
    return draft.deskripsi_kasus;
  } catch {
    return null;
  }
};

export const clearConsultationDraft = () => {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Abaikan: draft tetap kedaluwarsa sendiri.
  }
};
