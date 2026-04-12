export default function ProfileCard({ user }) {
  const { name, email, foto_profil, role, status_verifikasi } = user;

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=1f1d35&color=ada3ff&size=128`;

  // Helper warna berdasarkan status
  const getStatusColor = (status) => {
    switch (status) {
      case "terverifikasi":
        return "text-[#ada3ff]";
      case "pending":
        return "text-yellow-400";
      case "ditolak":
        return "text-[#f87171]";
      default:
        return "text-gray-400"; 
    }
  };

  // Helper untuk format teks yang rapi dibaca user
  const getStatusText = (status) => {
    switch (status) {
      case "terverifikasi":
        return "Terverifikasi";
      case "pending":
        return "Menunggu Verifikasi";
      case "ditolak":
        return "Verifikasi Ditolak";
      default:
        return "Belum Mengajukan";
    }
  };

  return (
    <section>
      <div className="bg-[#1f1d35] rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#ada3ff]/10 blur-[50px] rounded-full" />

        <div className="flex items-center gap-5 relative z-10">
          {/* Avatar Area */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#2c2945] border-2 border-[#48455a]/30 shadow-inner">
              <img
                key={foto_profil}
                src={foto_profil || fallbackUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = fallbackUrl;
                }}
              />
            </div>
          </div>

          {/* Info Area */}
          <div className="flex flex-col gap-0.5">
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#e8e2fc] mt-1">
              {name}
            </h2>
            <p className="text-[#aca8c1] text-sm font-medium">{email}</p>
            {/* Conditional Rendering untuk konsultan */}
            {role === "konsultan" && (
              <div className="inline-flex w-fit items-center justify-center px-3 py-1 mt-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <span
                  className={`text-[10px] lg:text-xs font-bold tracking-widest uppercase leading-none pt-[2px] ${getStatusColor(
                    status_verifikasi
                  )}`}
                >
                  {getStatusText(status_verifikasi)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}