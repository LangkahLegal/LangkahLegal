import { expect } from "@playwright/test";
import { Then } from "../../hooks/bdd.js";
import { routeOf, urlOf } from "../../pages/routes.js";
import { PRIVATE_PATHS } from "../../test_data/proteksi-halaman.data.js";

// ── GRD-001 · Pengunjung yang belum login tidak bisa membuka halaman privat

Then("setiap halaman privat mengarahkan pengunjung ke halaman {halaman}", async ({ page }, halaman) => {
  for (const path of PRIVATE_PATHS) {
    await page.goto(path);
    await expect(page, `alamat ${path}`).toHaveURL(urlOf(routeOf(halaman)));
  }
});

// ── GRD-002 · Pengunjung yang membuka halaman verifikasi konsultan diminta login
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-003 · Pengunjung yang membuka halaman basis pengetahuan diminta login
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-004 · Pengunjung yang membuka halaman contoh pembayaran diminta login
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-005 · Pengunjung dapat menjelajahi katalog konsultan
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-006 · Pengunjung yang bertanya ke Tanya AI diminta login
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-007 · Klien yang membuka dashboard konsultan dikembalikan ke dashboard klien
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-008 · Klien yang membuka dashboard admin dikembalikan ke dashboard klien
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-009 · Konsultan yang membuka dashboard klien dikembalikan ke dashboard konsultan
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-010 · Konsultan yang membuka dashboard admin dikembalikan ke dashboard konsultan
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-011 · Admin yang membuka dashboard klien dikembalikan ke dashboard admin
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-012 · Pengguna yang perannya belum diketahui diminta memilih peran
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-013 · Klien yang membuka jadwal dikembalikan ke dashboard klien
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-014 · Klien yang membuka bursa kasus dikembalikan ke dashboard klien
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-015 · Klien yang membuka verifikasi konsultan dikembalikan ke dashboard klien
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-016 · Konsultan yang membuka posting kasus dikembalikan ke dashboard konsultan
// Seluruh langkahnya memakai langkah bersama.

// ── GRD-017 · Konsultan yang membuka basis pengetahuan dikembalikan ke dashboard konsultan
// Seluruh langkahnya memakai langkah bersama.
