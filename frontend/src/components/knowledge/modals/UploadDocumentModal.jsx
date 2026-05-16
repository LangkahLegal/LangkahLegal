import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";
import { FileUpload } from "@/components/ui/FileUpload";
import Modal from "@/components/knowledge/Modal";
import { uploadDocumentPdf, getJobStatus } from "@/services/admin.service";

export default function UploadDocumentModal({ open, onClose, setActiveJobId, showToast }) {
  const queryClient = useQueryClient();
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadFile = async () => {
    if (!fileToUpload) return;
    try {
      setUploading(true);
      const res = await uploadDocumentPdf(fileToUpload);
      onClose();
      setFileToUpload(null);

      showToast("File diterima, sedang memproses di background...");

      // Poll status
      const jobId = res.job_id;
      setActiveJobId(jobId);

      const poll = setInterval(async () => {
        try {
          const statusRes = await getJobStatus(jobId);
          if (statusRes.status === "completed") {
            clearInterval(poll);
            setActiveJobId(null);
            showToast(statusRes.message || "Proses dokumen selesai!");
            queryClient.invalidateQueries(["documents"]);
          } else if (statusRes.status === "failed") {
            clearInterval(poll);
            setActiveJobId(null);
            console.error(`Gagal memproses dokumen: ${statusRes.error}`);
            showToast(`Gagal memproses dokumen: ${statusRes.error}`, "error");
          }
        } catch (e) {
          console.error("Gagal mengecek status", e);
          clearInterval(poll);
          setActiveJobId(null);
          showToast("Gagal mengecek status proses dari server.", "error");
        }
      }, 3000);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.detail || "Gagal mengunggah dokumen.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unggah Dokumen Baru"
      description="Unggah file PDF dokumen hukum."
    >
      <div className="space-y-6">
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-xs text-muted">
          <p className="font-bold text-main mb-2 flex items-center gap-1">
            <MaterialIcon name="gavel" className="text-[14px]" />
            Kriteria Dokumen Hukum:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Berisi Teks Digital:</strong> File tidak boleh hasil <em>scan</em> gambar. Teks wajib bisa di-blok/di-copy.</li>
            <li><strong>Identitas Resmi:</strong> Harus memiliki judul dan nomor resmi (misal: UU RI Nomor 1 Tahun 2024) untuk pembuatan metadata AI.</li>
            <li><strong>Struktur Pasal:</strong> Wajib memiliki struktur "Pasal" atau "Bab" yang jelas agar proses <em>chunking</em> berhasil.</li>
            <li><strong>Dokumen Baru:</strong> Pastikan dokumen ini belum ada di sistem. Gunakan <strong>Ganti</strong> jika hanya ingin memperbarui dokumen lama.</li>
          </ul>
        </div>

        <FileUpload
          file={fileToUpload}
          onChange={(file) => setFileToUpload(file)}
          accept=".pdf"
          maxSizeMB={50}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleUploadFile}
            disabled={!fileToUpload || uploading}
            isLoading={uploading}
          >
            Unggah
          </Button>
        </div>
      </div>
    </Modal>
  );
}
