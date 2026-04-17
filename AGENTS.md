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