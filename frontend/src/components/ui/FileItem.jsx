// components/ui/FileItem.jsx
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";

const FileIcon = ({ type }) => {
  switch (type) {
    case "pdf":
      return <MaterialIcon name="picture_as_pdf" className="text-red-400" />;
    case "image":
      return <MaterialIcon name="image" className="text-amber-400" />;
    default:
      return <MaterialIcon name="description" className="text-blue-400" />;
  }
};

export default function FileItem({ file, onClick, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <div
        onClick={onClick}
        className="group bg-[#1f1d35] p-4 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-[#6f59fe]/30 hover:bg-[#25233d] transition-all cursor-pointer"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#0e0c1e] flex items-center justify-center shrink-0 shadow-inner">
          <FileIcon type={file.type} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-[#6f59fe] transition-colors">
            {file.name}
          </h4>
          <p className="text-[11px] text-[#aca8c1] mt-0.5">
            {file.date} • {file.size}
          </p>
        </div>

        {/* Tombol Titik Tiga */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Agar tidak mentrigger onClick (view file)
            setShowMenu(!showMenu);
          }}
          className={`p-2 transition-colors ${showMenu ? "text-white" : "text-[#aca8c1] hover:text-white"}`}
        >
          <MaterialIcon name="more_vert" />
        </button>
      </div>

      {/* Popover Menu Delete */}
      {showMenu && (
        <>
          {/* Overlay untuk menutup menu jika klik di luar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          <div className="absolute right-4 top-14 z-20 bg-[#25233d] border border-white/10 rounded-2xl shadow-2xl p-2 min-w-[120px] animate-fade-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all text-xs font-bold"
            >
              <MaterialIcon name="delete" className="text-base" />
              Hapus
            </button>
          </div>
        </>
      )}
    </div>
  );
}
