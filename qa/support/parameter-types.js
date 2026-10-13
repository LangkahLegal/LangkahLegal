import { defineParameterType } from "playwright-bdd";
import { ROUTES } from "../pages/routes.js";
import { ACCOUNTS } from "../test_data/accounts.js";
import { CONSULTATION_STATUSES } from "../test_data/konsultasi.data.js";
import { SIGNUP_ROLES } from "../test_data/pendaftaran.data.js";
import { ENDPOINTS } from "./endpoints.js";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Pilihan terpanjang didahulukan agar "konsultan baru" tidak terbaca sebagai "konsultan". */
const anyOf = (names) =>
  new RegExp(
    [...names]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|"),
  );

/**
 * Mendaftarkan kumpulan kasus uji sebagai tipe parameter. Di file .feature kasus disebut
 * dengan namanya (mis. "terlalu pendek"), dan step definition langsung menerima datanya.
 */
export function defineCases(name, cases) {
  defineParameterType({
    name,
    regexp: anyOf(Object.keys(cases)),
    transformer: (key) => ({ key, ...cases[key] }),
  });
}

defineParameterType({ name: "halaman", regexp: anyOf(Object.keys(ROUTES)), transformer: (name) => name });
defineParameterType({ name: "akun", regexp: anyOf(Object.keys(ACCOUNTS)), transformer: (name) => name });
defineParameterType({ name: "layanan", regexp: anyOf(Object.keys(ENDPOINTS)), transformer: (name) => name });

// Dipakai oleh halaman pemilihan peran dan halaman pendaftaran.
defineCases("peranDaftar", SIGNUP_ROLES);

// Dipakai oleh setiap halaman yang menampilkan konsultasi.
defineCases("statusKonsultasi", CONSULTATION_STATUSES);
