import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";
import { FileUpload } from "@/components/ui/FileUpload";
import { Dropdown } from "@/components/ui/Dropdown";
import { InputField } from "@/components/ui/InputField";
import Modal from "@/components/knowledge/Modal";
import { replaceDocumentPdf } from "@/services/admin.service";

export default function ReplaceDocumentModal({ open, onClose, docToReplace, setActiveJobId, showToast }) {
  const [fileToReplace, setFileToReplace] = useState(null);
  const [replacing, setReplacing] = useState(false);

  const [formData, setFormData] = useState({
    nama_uu: "",
    nomor_uu: "",
    tahun_uu: "",
    kategori: "",
    status_hukum: "Berlaku",
  });

  useEffect(() => {
    if (open) {
      setFileToReplace(null);
      if (docToReplace) {
        setFormData({
          nama_uu: docToReplace.nama_uu || "",
          nomor_uu: docToReplace.nomor_uu || "",
          tahun_uu: docToReplace.tahun_uu || "",
          kategori: docToReplace.kategori || "",
          status_hukum: docToReplace.status_hukum || "Berlaku",
        });
      }
    }
  }, [open, docToReplace]);

  const isFormValid = fileToReplace && formData.nama_uu && formData.nomor_uu && formData.tahun_uu && formData.kategori && formData.status_hukum;

  const handleReplaceFile = async () => {
    if (!isFormValid || !docToReplace) return;
    try {
      setReplacing(true);
      const res = await replaceDocumentPdf(fileToReplace, docToReplace.frbr_uri, formData);
      onClose();
      setFileToReplace(null);

      showToast("File diterima, sedang mengganti dokumen di background...");

      const jobId = res.job_id;
      setActiveJobId(jobId);
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
      maxWidth="max-w-2xl"
      title="Ganti Dokumen"
      description={`Unggah PDF baru untuk menggantikan ${docToReplace?.nama_uu}`}
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
              value={formData.status_hukum}
              placeholder="Pilih Status Hukum"
              onChange={(val) => setFormData({ ...formData, status_hukum: val })}
              options={[
                { value: "Berlaku", label: "Berlaku" },
                { value: "Tidak Berlaku", label: "Tidak Berlaku" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FileUpload
            file={fileToReplace}
            onChange={(file) => setFileToReplace(file)}
            accept=".pdf"
            maxSizeMB={50}
            className="!py-5 !px-4 h-full"
          />
          <div className="text-[11px] text-muted flex flex-col justify-center h-full pl-2">
            <p className="font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5 text-xs">
              <MaterialIcon name="warning" className="text-[16px]" />
              Peringatan Ganti File
            </p>
            <p className="mb-2 leading-relaxed">File lama akan <strong>dihapus permanen</strong>. File pengganti wajib mematuhi syarat berikut:</p>
            <ul className="list-disc list-outside ml-4 space-y-2 marker:text-muted/40 leading-relaxed">
              <li>Berupa teks asli PDF yang dapat di-blok (bukan hasil scan).</li>
              <li>Memiliki struktur Bab/Pasal yang rapi untuk diekstraksi ulang oleh AI.</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleReplaceFile}
            disabled={!isFormValid || replacing}
            isLoading={replacing}
          >
            Ganti
          </Button>
        </div>
      </div>
    </Modal>
  );
}
