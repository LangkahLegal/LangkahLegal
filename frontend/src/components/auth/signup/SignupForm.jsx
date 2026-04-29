import { useState } from "react";
import { InputField, PasswordField, Button } from "@/components/ui";

export default function SignupForm({ onSubmit, isLoading, errorMsg }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

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
        label="Nama Lengkap"
        name="name"
        type="text"
        placeholder="John Doe"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <InputField
        label="Email"
        name="email"
        type="email"
        placeholder="example@langkahlegal.id"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <PasswordField
        name="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <Button type="submit" className="mt-4 w-full" disabled={isLoading}>
        {isLoading ? "Mengirim OTP..." : "Daftar"}
      </Button>
    </form>
  );
}
