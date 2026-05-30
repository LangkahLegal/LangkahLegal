import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";
import { FileUpload } from "@/components/ui/FileUpload";
import { Dropdown } from "@/components/ui/Dropdown";
import { InputField } from "@/components/ui/InputField";
import Modal from "@/components/knowledge/Modal";
import { uploadDocumentPdf, getJobStatus } from "@/services/admin.service";

export default function UploadDocumentModal({ open, onClose, setActiveJobId, showToast }) {
  const queryClient = useQueryClient();
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    nama_uu: "",
    nomor_uu: "",
    tahun_uu: "",
    kategori: "",
    status_hukum: "",
  });

  const isFormValid = fileToUpload && formData.nama_uu && formData.nomor_uu && formData.tahun_uu && formData.kategori && formData.status_hukum;

  const handleUploadFile = async () => {
    if (!isFormValid) return;
    try {
      setUploading(true);
      const res = await uploadDocumentPdf(fileToUpload, formData);
      onClose();
      setFileToUpload(null);

      showToast("File diterima, sedang memproses di background...");

      const jobId = res.job_id;
      setActiveJobId(jobId);
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
      maxWidth="max-w-2xl"
      title="Unggah Dokumen Baru"
      description="Unggah file PDF dokumen hukum."
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <InputField
            label="Nama Lengkap Dokumen/UU"
            placeholder="Contoh: Undang-Undang Perlindungan Data Pribadi"
            value={formData.nama_uu}
            onChange={(e) => setFormData({ ...formData, nama_uu: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Nomor Dokumen/UU"
              placeholder="Contoh: 27"
              value={formData.nomor_uu}
              onChange={(e) => setFormData({ ...formData, nomor_uu: e.target.value })}
            />
            <InputField
              label="Tahun"
              type="number"
              placeholder="Contoh: 2022"
              value={formData.tahun_uu}
              min={1945}
              max={new Date().getFullYear()}
              onChange={(e) => setFormData({ ...formData, tahun_uu: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Kategori Hukum"
              placeholder="Pilih Kategori"
              value={formData.kategori}
              onChange={(val) => setFormData({ ...formData, kategori: val })}
              options={[
                { value: "pidana", label: "Pidana" },
                { value: "perdata", label: "Perdata" },
                { value: "agama", label: "Agama" },
                { value: "umum", label: "Umum" },
                { value: "ketenagakerjaan", label: "Ketenagakerjaan" },
                { value: "perusahaan", label: "Perusahaan" },
                { value: "konsumen", label: "Konsumen" },
                { value: "pajak", label: "Pajak" },
                { value: "internasional", label: "Internasional" },
                { value: "tata_usaha_negara", label: "Tata Usaha Negara" },
                { value: "lingkungan", label: "Lingkungan" },
                { value: "hak_asasi_manusia", label: "Hak Asasi Manusia" },
                { value: "kesehatan", label: "Kesehatan" },
                { value: "teknologi_informasi", label: "Teknologi Informasi" },
                { value: "kekayaan_intelektual", label: "Kekayaan Intelektual" },
                { value: "maritim", label: "Maritim" },
                { value: "agraria", label: "Agraria" },
                { value: "lainnya", label: "Lainnya" },
              ]}
            />
            <Dropdown
              label="Status Hukum"
              placeholder="Pilih Status Hukum"
              value={formData.status_hukum}
              onChange={(val) => setFormData({ ...formData, status_hukum: val })}
              options={[
                { value: "Berlaku", label: "Berlaku" },
                { value: "Tidak Berlaku", label: "Tidak Berlaku" },
                { value: "Informasi", label: "Informasi" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FileUpload
            file={fileToUpload}
            onChange={(file) => setFileToUpload(file)}
            accept=".pdf"
            maxSizeMB={50}
            className="!py-5 !px-4 h-full"
          />
          <div className="text-[11px] text-muted flex flex-col justify-center h-full pl-2">
            <p className="font-bold text-main mb-2 flex items-center gap-1.5 text-xs">
              <MaterialIcon name="info" className="text-[16px] text-primary" />
              Syarat Berkas AI
            </p>
            <ul className="list-disc list-outside ml-4 space-y-2 marker:text-muted/40 leading-relaxed">
              <li><strong>Teks Digital:</strong> File wajib bisa di-blok/di-copy, bukan hasil foto/scan gambar.</li>
              <li><strong>Identitas Resmi:</strong> Mencantumkan nomor dan tahun dengan jelas.</li>
              <li><strong>Struktur Teks:</strong> Memiliki format Bab/Pasal yang rapi agar sistem ekstraksi berfungsi optimal.</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleUploadFile}
            disabled={!isFormValid || uploading}
            isLoading={uploading}
          >
            Unggah
          </Button>
        </div>
      </div>
    </Modal>
  );
}
