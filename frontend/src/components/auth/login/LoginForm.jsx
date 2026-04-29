import { useState } from "react";
import { InputField, PasswordField, Button } from "@/components/ui";

export default function LoginForm({ onSubmit, isLoading, errorMsg }) {
  const [formData, setFormData] = useState({ email: "", password: "" });

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

      <InputField
        label="Email"
        name="email"
        type="email"
        placeholder="nama@gmail.com"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <PasswordField
        name="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
      />

      <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
        {isLoading ? "Memverifikasi..." : "Masuk"}
      </Button>
    </form>
  );
}
