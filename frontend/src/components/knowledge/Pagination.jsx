import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

export default function Pagination({
  page,
  totalPages,
  setPage,
  isFetching = false,
  className = "",
}) {
  const [inputPage, setInputPage] = useState(page);

  useEffect(() => {
    setInputPage(page);
  }, [page]);

  const handlePageSubmit = (e) => {
    if (e) e.preventDefault();
    const newPage = parseInt(inputPage, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    } else {
      setInputPage(page);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handlePageSubmit(e);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-bold text-muted uppercase tracking-widest px-2">
          Halaman
        </span>
        <input
          type="text"
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={handlePageSubmit}
          onKeyDown={handleKeyDown}
          disabled={isFetching}
          className="w-10 h-7 text-center text-[11px] font-bold bg-card border border-surface rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-main transition-colors"
        />
        <span className="text-[11px] font-bold text-muted uppercase tracking-widest px-2">
          dari {totalPages}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        {isFetching && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
        )}
        <Button
          variant="ghost"
          className="!p-1 text-muted hover:text-main hover:bg-surface/50 rounded-lg flex items-center justify-center transition-colors"
          disabled={page <= 1 || isFetching}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          title="Sebelumnya"
        >
          <MaterialIcon name="chevron_left" className="text-xl" />
        </Button>
        <Button
          variant="ghost"
          className="!p-1 text-muted hover:text-main hover:bg-surface/50 rounded-lg flex items-center justify-center transition-colors"
          disabled={page >= totalPages || isFetching}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          title="Selanjutnya"
        >
          <MaterialIcon name="chevron_right" className="text-xl" />
        </Button>
      </div>
    </div>
  );
}
