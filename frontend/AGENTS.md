# LangkahLegal Vibecoding Guide

## Scope
File ini berlaku untuk seluruh monorepo, kecuali jika ada aturan yang lebih spesifik di folder turunan.

## Monorepo Context
- backend: Python 3, FastAPI, Supabase
- frontend: Next.js App Router, React

## Core Principles
1. Pahami konteks sebelum mengubah kode.
2. Lakukan perubahan sekecil mungkin untuk menyelesaikan masalah.
3. Jaga kontrak API dan kompatibilitas frontend-backend.
4. Validasi hasil sebelum menandai task selesai.

## Vibecoding Workflow
1. Scan cepat
- Baca file relevan dan dependency terdekat.
- Petakan alur input -> proses -> output.

2. Eksekusi presisi
- Prioritaskan solusi paling sederhana yang tetap benar.
- Hindari refactor besar jika tidak diminta.

3. Validasi cepat
- Jalankan test yang paling relevan.
- Untuk endpoint: cek bentuk request dan response.
- Untuk UI: cek loading, empty, dan error state.

4. Ringkasan hasil
- Jelaskan apa yang diubah.
- Jelaskan dampak dan risiko regression yang tersisa.

## Guardrails
1. Jangan mengubah file di luar scope permintaan user.
2. Jangan pakai command destruktif tanpa persetujuan eksplisit.
3. Jika menemukan perubahan tak terduga yang bukan bagian task, hentikan eksekusi dan minta konfirmasi user.

## Definition Of Done
1. Permintaan user terpenuhi secara fungsional.
2. Perubahan minimal, konsisten, dan aman.
3. Verifikasi relevan sudah dijalankan atau disebutkan keterbatasannya.

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