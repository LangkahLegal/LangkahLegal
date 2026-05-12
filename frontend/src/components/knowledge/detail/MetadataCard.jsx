import { Badge, StatusBadge } from "@/components/knowledge/KnowledgeTable";

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
};

export default function MetadataCard({ meta, totalChunks }) {
    if (!meta) return null;
    
    return (
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-surface shadow-soft space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-wrap items-center gap-2 mb-4 relative z-10">
                <Badge variant="primary">{meta.kategori}</Badge>
                <StatusBadge status={meta.status_hukum} />
            </div>

            <div className="relative z-10">
                <h2 className="text-2xl font-black text-main leading-tight tracking-tight mb-3">
                    {meta.nama_uu}
                </h2>
                <p className="text-sm font-semibold text-primary-light mb-3">
                    {meta.nomor_uu || meta.tahun_uu ? `Nomor ${meta.nomor_uu ?? '-'} Tahun ${meta.tahun_uu ?? '-'}` : '-'}
                </p>
                <p className="text-[10px] font-mono tracking-wider truncate max-w-[200px] sm:max-w-xs">
                    {meta.frbr_uri}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-surface pt-6 mt-6 relative z-10">
                <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Pasal</p>
                    <p className="text-sm font-semibold text-main mt-1">{totalChunks}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Terakhir Diperbarui</p>
                    <p className="text-sm font-semibold text-main mt-1">
                        {formatDate(meta.updated_at)}
                    </p>
                </div>
            </div>
        </div>
    );
}
