"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/layout/SearchBar";
import Filter from "@/components/layout/Filter";
import FileUpload from "@/components/layout/FileUpload";

import FileItem from "@/components/documents/FileItem";
import SecurityNotice from "@/components/documents/SecurityNotice";

const INITIAL_FILES = [
  {
    id: 1,
    name: "Draft Kontrak Sewa.pdf",
    date: "24 Okt 2023",
    size: "1.2 MB",
    type: "pdf",
  },
  {
    id: 2,
    name: "NDA_Karyawan_Baru.doc",
    date: "21 Okt 2023",
    size: "845 KB",
    type: "doc",
  },
  {
    id: 3,
    name: "KTP_Pemohon_Scan.jpg",
    date: "18 Okt 2023",
    size: "2.4 MB",
    type: "image",
  },
  {
    id: 4,
    name: "Syarat_Ketentuan_App.pdf",
    date: "15 Okt 2023",
    size: "1.1 MB",
    type: "pdf",
  },
  {
    id: 5,
    name: "Sertifikat_HAKI_Brand.pdf",
    date: "10 Okt 2023",
    size: "3.5 MB",
    type: "pdf",
  },
  {
    id: 6,
    name: "Akta_Pendirian_PT_Langkah.pdf",
    date: "05 Okt 2023",
    size: "5.2 MB",
    type: "pdf",
  },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const filteredFiles = INITIAL_FILES.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Documents" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Design Baru dengan fungsionalitas Upload */}
            <FileUpload file={selectedFile} onChange={setSelectedFile} />

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Cari dokumen..."
                />
              </div>
              <Filter onClick={() => console.log("Filter open")} />
            </div>

            <section className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h2 className="font-bold text-lg lg:text-xl text-white">
                  All Documents
                </h2>
                <span className="bg-[#6f59fe]/10 text-[#ada3ff] text-[10px] font-bold px-3 py-1 rounded-full border border-[#6f59fe]/20 uppercase tracking-widest">
                  {filteredFiles.length} Files
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredFiles.map((file) => (
                  <FileItem key={file.id} file={file} />
                ))}
              </div>
            </section>

            <SecurityNotice />
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
