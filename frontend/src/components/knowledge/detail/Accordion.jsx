import { useState, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/knowledge/KnowledgeTable";

const KATEGORI_HUKUM = [
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
    { value: "lainnya", label: "Lainnya" }
];

function Textarea({ label, value, onChange, placeholder, disabled, rows = 6 }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-widest">{label}</label>
            <textarea
                className="w-full bg-input border border-surface rounded-xl px-4 py-3 text-xs text-muted leading-relaxed focus:outline-none focus:border-primary transition-colors disabled:opacity-50 resize-y"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
            />
        </div>
    );
}

const renderIsiTeks = (teks) => {
    if (!teks) return null;
    return teks.split('\n').map((line, idx) => {
        const isAyat = /^(\(\d+\)|\d+\.|[a-z]\.)/.test(line.trim());
        return (
            <p key={idx} className={`text-xs text-muted leading-relaxed whitespace-pre-wrap group-hover:text-main transition-colors ${isAyat ? 'pl-4 sm:pl-6' : ''}`}>
                {line}
            </p>
        );
    });
};

export default function Accordion({ title, badge, chunk, onSaveEdit, isSaving, isForceOpen }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ isi_teks: chunk?.isi_teks || "", kategori: chunk?.kategori || "" });

    useEffect(() => {
        setIsOpen(isForceOpen);
    }, [isForceOpen]);

    const handleSave = () => {
        onSaveEdit(chunk.id_dokumen, form, () => setIsEditing(false));
    };

    const handleCancel = () => {
        setForm({ isi_teks: chunk?.isi_teks || "", kategori: chunk?.kategori || "" });
        setIsEditing(false);
    };

    return (
        <div className={`border rounded-2xl bg-card shadow-soft overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/40 shadow-lg' : 'border-surface hover:border-primary/20'}`}>
            <div
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isOpen ? 'bg-primary/5' : 'hover:bg-surface/10'}`}
                onClick={() => !isEditing && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <MaterialIcon
                        name="expand_more"
                        className={`text-xl transition-transform duration-300 ${isOpen ? "rotate-180 text-primary-light" : "text-muted"}`}
                    />
                    <h5 className={`font-bold text-sm ${isOpen ? 'text-primary-light' : 'text-main'}`}>{title}</h5>
                </div>
                <div className="flex items-center gap-3">
                    {badge && <Badge variant={isOpen ? "primary" : "default"}>{badge}</Badge>}
                </div>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                    <div className="p-4 border-t border-surface bg-surface/5">
                        {isEditing ? (
                            <div className="space-y-4">
                                <Dropdown
                                    label="Kategori"
                                    value={form.kategori}
                                    onChange={(val) => setForm({ ...form, kategori: val })}
                                    options={KATEGORI_HUKUM}
                                    placeholder="Pilih Kategori..."
                                    className="[&>button]:!font-normal [&>button]:!font-primary [&>button]:!text-xs [&>button]:!py-3 [&_div.mx-2]:!font-normal [&_div.mx-2]:!font-primary [&_div.mx-2]:!text-xs"
                                />
                                <Textarea
                                    label="Isi Teks Pasal"
                                    value={form.isi_teks}
                                    onChange={(val) => setForm({ ...form, isi_teks: val })}
                                    rows={8}
                                    disabled={isSaving}
                                />
                                <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex gap-2 text-primary-light mt-2">
                                    <MaterialIcon name="info" className="text-base shrink-0" />
                                    <p className="text-xs leading-relaxed">
                                        Perubahan isi pasal akan memperbarui embedding AI secara otomatis.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" onClick={handleCancel} disabled={isSaving}>
                                        Batal
                                    </Button>
                                    <Button variant="primary" className="!py-1.5 !px-3 !text-xs" onClick={handleSave} isLoading={isSaving}>
                                        Simpan
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 space-y-3">
                                    {chunk.judul_bab && (
                                        <p className="text-xs font-semibold text-primary-light uppercase tracking-wide">{chunk.judul_bab}</p>
                                    )}
                                    <div className="space-y-2">
                                        {renderIsiTeks(chunk.isi_teks)}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="outline" className="!py-1.5 !px-3 !text-xs text-primary-light border-primary/20 hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                                        <MaterialIcon name="edit" className="text-[14px]" />
                                        Edit Pasal
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
