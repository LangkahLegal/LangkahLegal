export default function ProfileCard({ user }) {
  // Destructuring hanya foto_profil, hapus avatar
  const { name, email, foto_profil } = user;

  // Fallback URL jika foto_profil kosong atau null
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=1f1d35&color=ada3ff&size=128`;

  return (
    <section>
      <div className="bg-[#1f1d35] rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#ada3ff]/10 blur-[50px] rounded-full" />

        <div className="flex items-center gap-5 relative z-10">
          {/* Avatar Area */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#2c2945] border-2 border-[#48455a]/30 shadow-inner">
              <img
                // Gunakan key foto_profil agar gambar langsung refresh saat diupdate
                key={foto_profil}
                src={foto_profil || fallbackUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Proteksi tambahan jika link di database mati
                  e.target.src = fallbackUrl;
                }}
              />
            </div>
          </div>

          {/* Info Area */}
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#e8e2fc]">
              {name}
            </h2>
            <p className="text-[#aca8c1] text-sm font-medium">{email}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
