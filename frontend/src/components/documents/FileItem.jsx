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

export default function FileItem({ file }) {
  return (
    <div className="group bg-[#1f1d35] p-4 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-[#6f59fe]/30 hover:bg-[#25233d] transition-all cursor-pointer">
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
      <button className="p-2 text-[#aca8c1] hover:text-white transition-colors">
        <MaterialIcon name="more_vert" />
      </button>
    </div>
  );
}
