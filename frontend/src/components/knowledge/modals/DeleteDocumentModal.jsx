import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/knowledge/Modal";
import { deleteFullDocumentByUri } from "@/services/admin.service";

export default function DeleteDocumentModal({ open, onClose, docToDelete, showToast }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (uri) => deleteFullDocumentByUri(uri),
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
      showToast("Dokumen berhasil dihapus!");
      onClose();
    },
    onError: () => {
      console.error("Gagal menghapus dokumen");
      showToast("Gagal menghapus dokumen", "error");
      onClose();
    },
  });

  const confirmDelete = () => {
    if (docToDelete) {
      deleteMutation.mutate(docToDelete.frbr_uri);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Hapus Dokumen?">
      <div className="space-y-6">
        <p className="text-sm text-muted">
          Yakin ingin menghapus dokumen <span className="font-bold text-main">{docToDelete?.nama_uu}</span>?
          Semua pasal yang terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="danger"
            className="flex-1 font-bold !bg-danger !text-white !border-danger hover:!brightness-110"
            onClick={confirmDelete}
            isLoading={deleteMutation.isPending}
          >
            Ya, Hapus
          </Button>
        </div>
      </div>
    </Modal>
  );
}
