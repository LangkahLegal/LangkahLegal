# Frontend Vibecoding Guide

## Scope
Aturan ini khusus untuk folder frontend dan menambah detail dari aturan global di root.

## Frontend Context
- Framework: Next.js App Router + React
- Struktur penting: src/app, src/components, src/services, src/lib

## Mandatory Rules
1. Anggap setup Next.js proyek ini memiliki breaking changes dibanding panduan umum.
2. Cek panduan Next.js internal di node_modules sebelum memakai fitur framework-level baru.
3. Pertahankan pola App Router dan struktur folder yang sudah ada.
4. Komunikasi API melalui service layer di src/services, bukan fetch acak di banyak komponen.
5. Jangan merusak kontrak data yang dikonsumsi UI lain.

## UI Delivery Standard
1. Setiap flow minimal punya state: loading, success, empty, error.
2. Form harus punya validasi input dasar dan feedback error yang jelas.
3. Hindari hardcoded URL sensitif; pakai konfigurasi yang sudah ada.
4. Hindari over-coupling antar komponen dan page.

## Fast Frontend Checklist
1. Tidak ada hydration warning yang terlihat.
2. Tidak pakai API Next.js yang deprecated untuk setup ini.
3. Import path rapi dan konsisten dengan pola existing.
4. Perubahan terbatas pada area yang diminta user.

## Done Criteria
1. Fitur atau bugfix berjalan sesuai request.
2. Dampak ke page lain minim dan terkontrol.
3. Verifikasi singkat dijalankan atau keterbatasan verifikasi dijelaskan.