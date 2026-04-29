"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

const FileIcon = ({ type }) => {
  switch (type) {
    case "pdf":
      // Tetap merah tapi menggunakan tone yang pas
      return (
        <MaterialIcon
          name="picture_as_pdf"
          className="text-red-500 dark:text-red-400"
        />
      );
    case "image":
      // Menggunakan warna secondary (Gold) dari tema baru Anda
      return <MaterialIcon name="image" className="text-secondary" />;
    default:
      return <MaterialIcon name="description" className="text-primary-light" />;
  }
};

export default function FileItem({
  file,
  onClick,
  onDelete,
  allowDelete = false,
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={`
          group flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer
          bg-card border-surface 
          hover:border-primary/30 hover:bg-surface/50
        `}
      >
        {/* Icon Container */}
        <div className="w-12 h-12 rounded-xl bg-base flex items-center justify-center shrink-0 shadow-inner">
          <FileIcon type={file.type} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-main truncate group-hover:text-primary transition-colors">
            {file.name}
          </h4>
          <p className="text-[11px] text-muted mt-0.5 font-medium">
            {file.date} • {file.size}
          </p>
        </div>

        {/* Menu Trigger menggunakan Button UI */}
        {allowDelete && (
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`!p-2 ${showMenu ? "text-primary bg-surface" : "text-muted"}`}
          >
            <MaterialIcon name="more_vert" />
          </Button>
        )}
      </div>

      {/* Popover Menu Delete */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          <div className="absolute right-4 top-16 z-20 bg-card border border-surface rounded-2xl shadow-soft p-1.5 min-w-[140px] animate-fade-in">
            <Button
              variant="danger"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="!justify-start !py-2.5 !px-3 !text-xs !rounded-xl"
            >
              <MaterialIcon name="delete" className="text-lg" />
              <span>Hapus Berkas</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
