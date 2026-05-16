import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";
import { FileUpload } from "@/components/ui/FileUpload";
import Modal from "@/components/knowledge/Modal";
import { replaceDocumentPdf, getJobStatus } from "@/services/admin.service";

export default function ReplaceDocumentModal({ open, onClose, docToReplace, setActiveJobId, showToast }) {
  const queryClient = useQueryClient();
  const [fileToReplace, setFileToReplace] = useState(null);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    if (open) {
      setFileToReplace(null);
    }
  }, [open]);

  const handleReplaceFile = async () => {
    if (!fileToReplace || !docToReplace) return;
    try {
      setReplacing(true);
      const res = await replaceDocumentPdf(fileToReplace, docToReplace.frbr_uri);
      onClose();
      setFileToReplace(null);

      showToast("File diterima, sedang mengganti dokumen di background...");

      // Poll status
      const jobId = res.job_id;
      setActiveJobId(jobId);

      const poll = setInterval(async () => {
        try {
          const statusRes = await getJobStatus(jobId);
          if (statusRes.status === "completed") {
            clearInterval(poll);
            setActiveJobId(null);
            showToast(statusRes.message || "Proses ganti dokumen selesai!");
            queryClient.invalidateQueries(["documents"]);
          } else if (statusRes.status === "failed") {
            clearInterval(poll);
            setActiveJobId(null);
            console.error(`Gagal mengganti dokumen: ${statusRes.error}`);
            showToast(`Gagal mengganti dokumen: ${statusRes.error}`, "error");
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
      showToast(error.response?.data?.detail || "Gagal mengganti dokumen.", "error");
    } finally {
      setReplacing(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ganti Dokumen"
      description={`Unggah PDF baru untuk menggantikan ${docToReplace?.nama_uu}`}
    >
      <div className="space-y-6">
        <div className="bg-warning/10 p-4 rounded-xl border border-warning/20 text-xs text-amber-600 dark:text-amber-400">
          <p className="font-bold flex items-center gap-1 mb-2">
            <MaterialIcon name="info" className="text-[14px]" />
            Peringatan Penggantian
          </p>
          <p className="mb-2">File lama akan dihapus sepenuhnya. Pastikan file pengganti memenuhi syarat:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Teks Asli:</strong> Bukan hasil scan gambar, teks harus bisa di-blok.</li>
            <li><strong>Dokumen Hukum Asli:</strong> Memiliki judul, nomor resmi, dan struktur "Pasal" yang jelas.</li>
          </ul>
        </div>

        <FileUpload
          file={fileToReplace}
          onChange={(file) => setFileToReplace(file)}
          accept=".pdf"
          maxSizeMB={50}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleReplaceFile}
            disabled={!fileToReplace || replacing}
            isLoading={replacing}
          >
            Ganti
          </Button>
        </div>
      </div>
    </Modal>
  );
}
