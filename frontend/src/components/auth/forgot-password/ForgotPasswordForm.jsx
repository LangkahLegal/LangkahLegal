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
        <div className="p-4 bg-success-soft border border-success/25 rounded-xl">
          <h3 className="text-success font-semibold mb-2" data-testid="forgot-password-sent-message">Tautan Terkirim!</h3>
          <p className="text-sm text-success/90">
            Silakan periksa kotak masuk email Anda ({email}) untuk menemukan tautan reset password.
          </p>
        </div>
        <Link href="/auth/login" className="block text-center w-full mt-4 py-2 text-sm text-primary-light font-bold transition-colors duration-200 hover:underline underline-offset-4">
          Kembali ke halaman Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 text-sm text-danger bg-danger-soft border border-danger/25 rounded-xl">
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
        data-testid="forgot-password-email-input"
      />

      <Button type="submit" className="mt-2 w-full" disabled={isLoading} data-testid="forgot-password-submit-btn">
        {isLoading ? "Mengirim..." : "Kirim Link Reset"}
      </Button>

      <p className="text-center mt-6 text-sm font-medium text-muted">
        Ingat password Anda?{" "}
        <Link href="/auth/login" className="inline-block py-2 -my-2 ml-1 text-primary-light font-bold transition-colors duration-200 hover:underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </form>
  );
}
