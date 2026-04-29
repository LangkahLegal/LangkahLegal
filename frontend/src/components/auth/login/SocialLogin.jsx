import { Button, GoogleIcon } from "@/components/ui";

export default function SocialLogin({ onGoogleLogin }) {
  return (
    <div className="mt-6 space-y-5">
      {/* REFACTOR: .auth-divider */}
      <div className="flex items-center py-2 w-full">
        {/* REFACTOR: .auth-divider-line */}
        <div className="flex-grow h-px bg-muted/20" />

        {/* REFACTOR: .auth-divider-text */}
        <span className="px-4 text-sm font-medium text-muted whitespace-nowrap">
          Atau masuk dengan
        </span>

        {/* REFACTOR: .auth-divider-line */}
        <div className="flex-grow h-px bg-muted/20" />
      </div>

      <Button variant="social" type="button" fullWidth onClick={onGoogleLogin}>
        <GoogleIcon />
        <span>Masuk dengan Google</span>
      </Button>
    </div>
  );
}
