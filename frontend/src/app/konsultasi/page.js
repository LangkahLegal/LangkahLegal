"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import CategoryList from "@/components/dashboard/CategoryList";
import PageHeader from "@/components/layout/PageHeader"; // Import komponen baru
import SearchBar from "@/components/konsultasi/SearchBar";
import ConsultantCard from "@/components/konsultasi/ConsultantCard";
import AIBanner from "@/components/konsultasi/AIBanner";

const CONSULTANTS = [
  {
    id: 1,
    name: "Andi Pratama, S.H.",
    spec: "Spesialis Hukum Pidana",
    rating: 4.9,
    reviews: 120,
    status: "online",
    avatar: "/api/placeholder/64/64",
  },
  {
    id: 2,
    name: "Siti Aminah, M.H.",
    spec: "Hukum Keluarga & Perdata",
    rating: 4.8,
    reviews: 95,
    status: "online",
    avatar: "/api/placeholder/64/64",
  },
  {
    id: 3,
    name: "Budi Santoso, S.H.",
    spec: "Konsultan Hukum Korporat",
    rating: 5.0,
    reviews: 240,
    status: "offline",
    avatar: "/api/placeholder/64/64",
  },
  {
    id: 4,
    name: "Diana Putri, S.H.",
    spec: "Spesialis Kekayaan Intelektual",
    rating: 4.7,
    reviews: 56,
    status: "online",
    avatar: "/api/placeholder/64/64",
  },
];

const CATEGORIES = [
  { id: "semua", label: "Semua", active: true },
  { id: "pidana", label: "Pidana", active: false },
  { id: "perdata", label: "Perdata", active: false },
  { id: "korporat", label: "Korporat", active: false },
];
export default function KonsultasiPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        {/* Menggunakan PageHeader yang baru */}
        <PageHeader
          title="Cari Konsultan"
          icon="gavel"
          onSettingsClick={() => console.log("Open Settings")}
        />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 lg:px-12 space-y-10 pb-32 lg:pb-12">
          {/* SearchBar Modular */}
          <SearchBar value={search} onChange={setSearch} />

          <CategoryList categories={CATEGORIES} />

          {/* List Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 w-full">
            {CONSULTANTS.map((pro) => (
              <ConsultantCard key={pro.id} consultant={pro} />
            ))}
          </section>

          <AIBanner onAction={() => console.log("AI Chat Started")} />
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}