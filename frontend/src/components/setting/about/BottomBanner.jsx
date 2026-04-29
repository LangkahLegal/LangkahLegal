"use client";

import React from "react";

export default function BottomBanner() {
  return (
    /* REFACTOR: 
       - border-white/10 -> border-surface 
       - Tambahkan transition-colors untuk perpindahan tema yang halus 
    */
    <div className="relative overflow-hidden rounded-[2rem] h-48 lg:h-64 flex items-end p-6 lg:p-10 border border-surface shadow-2xl mb-12 transition-all duration-500">
      <img
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI_KMChwILg_opiZ7BxrxayimIAHA6ubtARG6hzJdtqExxec6HX_6qYz5RzZcGV8G8_0iKvmZfj4I854CjoSYJN9QVKB0GN7OhV7xme98ur5ypuJ5f8ptxt2Ejl3pjQC9gtv9P-T4kYxnVDlfdm8rAQOY0k4feok8NMrX7pVfBna5xWNyMEzLkdO_pBSuy6hjf8GJErBljGpgbepIuuROXk-pJDQu3UoMV90_UMR1mSoFydpNPfyARhlYgAspAzwqPbrAuxTR7-HqM"
        alt="Legal Tech Concept"
        /* Opacity tetap dijaga agar gambar tidak terlalu kontras dengan teks */
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-40"
      />

      {/* REFACTOR: 
          - from-[#0e0c1e] -> from-bg (Mengikuti warna background tema)
      */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent transition-colors duration-500" />

      <div className="relative z-10">
        {/* REFACTOR: 
            - text-white -> text-main (Menjadi gelap di mode terang)
        */}
        <h2 className="text-2xl lg:text-4xl font-bold text-main leading-tight transition-colors duration-500">
          Langkah Kecil,
          <br />
          Solusi Legal Besar.
        </h2>
      </div>
    </div>
  );
}
