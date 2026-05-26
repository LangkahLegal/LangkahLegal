import { useState } from "react";
import { PasswordField, Button } from "@/components/ui";

export default function ResetPasswordForm({ onSubmit, isLoading, errorMsg }) {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          {errorMsg}
        </div>
      )}

      <PasswordField
        label="Password Baru"
        name="newPassword"
        placeholder="••••••••"
        value={formData.newPassword}
        onChange={handleChange}
      />

      <PasswordField
        label="Konfirmasi Password Baru"
        name="confirmPassword"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
      />

      <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
        {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
      </Button>
    </form>
  );
}
