import { useState } from "react";
import { InputField, Button } from "@/components/ui";
import Link from "next/link";

export default function ForgotPasswordForm({ onSubmit, isLoading, errorMsg, isSuccess }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email);
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center md:text-left">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <h3 className="text-emerald-500 font-semibold mb-2">Tautan Terkirim!</h3>
          <p className="text-sm text-emerald-400/80">
            Silakan periksa kotak masuk email Anda ({email}) untuk menemukan tautan reset password.
          </p>
        </div>
        <Link href="/auth/login" className="block text-center w-full mt-4 text-sm font-medium text-brand hover:text-brand-light transition-colors">
          Kembali ke halaman Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          {errorMsg}
        </div>
      )}

      <InputField
        label="Email"
        name="email"
        type="email"
        placeholder="nama@gmail.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
        {isLoading ? "Mengirim..." : "Kirim Link Reset"}
      </Button>

      <div className="text-center mt-6">
        <Link href="/auth/login" className="text-sm font-medium text-muted hover:text-main transition-colors">
          Ingat password Anda? Masuk
        </Link>
      </div>
    </form>
  );
}
