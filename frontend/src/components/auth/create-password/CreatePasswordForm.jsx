import { useState } from "react";
import { PasswordField, Button } from "@/components/ui";

export default function CreatePasswordForm({ onSubmit, isLoading, errorMsg }) {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [validationError, setValidationError] = useState("");

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (formData.password.length < 6) {
      setValidationError("Password minimal 6 karakter.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    onSubmit({ password: formData.password });
  };

  const displayError = validationError || errorMsg;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="create-password-form"
    >
      {displayError && (
        <div
          className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl"
          data-testid="create-password-error-msg"
        >
          {displayError}
        </div>
      )}

      <PasswordField
        label="Password Baru"
        name="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        required
        data-testid="create-password-input"
      />

      <PasswordField
        label="Konfirmasi Password"
        id="confirmPassword"
        name="confirmPassword"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        data-testid="create-password-confirm-input"
      />

      <Button
        type="submit"
        className="mt-4 w-full"
        disabled={isLoading}
        data-testid="create-password-submit-btn"
      >
        {isLoading ? "Menyimpan..." : "Simpan Password"}
      </Button>
    </form>
  );
}
