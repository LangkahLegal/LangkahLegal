import { Suspense } from "react";
import DocumentsClient from "./DocumentsClient";

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#6D57FC] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#ada3ff] animate-pulse">
              Memuat dokumen...
            </p>
          </div>
        </div>
      }
    >
      <DocumentsClient />
    </Suspense>
  );
}
