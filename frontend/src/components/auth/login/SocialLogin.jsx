import { Button, GoogleIcon } from "@/components/ui";

export default function SocialLogin({ onGoogleLogin }) {
  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center py-2 w-full">
        <div className="flex-grow h-px bg-muted/20" />

        <span className="px-4 text-sm font-medium text-muted whitespace-nowrap">
          Atau masuk dengan
        </span>

        <div className="flex-grow h-px bg-muted/20" />
      </div>

      <Button variant="social" type="button" fullWidth onClick={onGoogleLogin} data-testid="google-login-btn">
        <GoogleIcon />
        <span>Masuk dengan Google</span>
      </Button>
    </div>
  );
}
