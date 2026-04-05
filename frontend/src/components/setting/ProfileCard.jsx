export default function ProfileCard({ user }) {
  const { name, email, avatar, isPremium } = user;

  return (
    <section>
      <div className="bg-[#1f1d35] rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#ada3ff]/10 blur-[50px] rounded-full" />

        <div className="flex items-center gap-5 relative z-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#2c2945] border-2 border-[#48455a]/30 shadow-inner">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#e8e2fc]">
              {name}
            </h2>
            <p className="text-[#aca8c1] text-sm font-medium">{email}</p>
            {isPremium && (
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ada3ff]/10 text-[#ada3ff] uppercase tracking-wider">
                Premium Member
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}