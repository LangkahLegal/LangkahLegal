import { ACCOUNTS } from "./accounts.js";

const profile = ACCOUNTS.konsultan.konsultan;

/** Konsultan uji seperti yang terlihat di katalog. */
export const CATALOG_CONSULTANT = {
  name: profile.nama_lengkap,
  nameMixedCase: "sIt KoNsUlTaN",
  expertiseKeyword: "Pidana",
  category: { label: "Pidana", query: "pidana" },
  verification: "Verified",
  priceLabel: "Rp 150.000",
  priceRange: { min: String(profile.tarif_per_sesi - 50000), max: String(profile.tarif_per_sesi + 50000) },
  description: profile.deskripsi_lengkap,
};

export const SEARCHES = {
  noMatch: "zzzz-tidak-ada",
  extreme: ["A".repeat(500), "<script>alert(1)</script>", "' OR 1=1 --", "测试 🚀"],
  reversedPrice: { min: "500000000", max: "1" },
};

const catalogItem = (overrides) => ({
  id: 990001,
  name: "Clara Hutapea",
  spec: "Hukum Perdata",
  rating: 4.5,
  reviews: 3,
  status: "aktif",
  status_verifikasi: "terverifikasi",
  tarif_per_sesi: 100000,
  foto_profil: null,
  ...overrides,
});

/** Isi katalog yang tidak bisa dibuat lewat aplikasi, untuk skenario @stub. */
export const STUBBED_CATALOGS = {
  "foto profil berbahaya": {
    data: [catalogItem({ foto_profil: "javascript:alert(1)" })],
    total: 1,
    name: "Clara Hutapea",
  },
  "nama yang kosong": {
    data: [catalogItem(), catalogItem({ id: 990002, name: null })],
    total: 2,
    name: "Clara Hutapea",
  },
};
