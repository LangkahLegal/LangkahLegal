import { Button, GoogleIcon } from "@/components/ui";

export default function SocialSignup({ onGoogleSignup }) {
  return (
    <div className="mt-6 space-y-5">
      {/* Divider - Tailwind Pure */}
      <div className="flex items-center py-2 w-full">
        <div className="flex-grow h-px bg-muted/20" />
        <span className="px-4 text-sm font-medium text-muted whitespace-nowrap">
          Atau daftar dengan
        </span>
        <div className="flex-grow h-px bg-muted/20" />
      </div>

      {/* Menggunakan Komponen Button yang sudah di-refactor */}
      <Button
        variant="social"
        type="button"
        fullWidth
        onClick={onGoogleSignup}
      >
        <GoogleIcon />
        <span>Daftar dengan Google</span>
      </Button>
    </div>
  );
}