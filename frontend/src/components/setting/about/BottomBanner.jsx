export default function BottomBanner() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] h-48 lg:h-64 flex items-end p-6 lg:p-10 border border-white/10 shadow-2xl mb-12">
      <img 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI_KMChwILg_opiZ7BxrxayimIAHA6ubtARG6hzJdtqExxec6HX_6qYz5RzZcGV8G8_0iKvmZfj4I854CjoSYJN9QVKB0GN7OhV7xme98ur5ypuJ5f8ptxt2Ejl3pjQC9gtv9P-T4kYxnVDlfdm8rAQOY0k4feok8NMrX7pVfBna5xWNyMEzLkdO_pBSuy6hjf8GJErBljGpgbepIuuROXk-pJDQu3UoMV90_UMR1mSoFydpNPfyARhlYgAspAzwqPbrAuxTR7-HqM" 
        alt="Legal Tech Concept" 
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c1e] via-transparent to-transparent" />
      
      <div className="relative z-10">
        <h2 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
          Langkah Kecil,<br />
          Solusi Legal Besar.
        </h2>
      </div>
    </div>
  );
}