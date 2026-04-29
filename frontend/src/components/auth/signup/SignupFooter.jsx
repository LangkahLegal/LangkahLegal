import Link from "next/link";

export default function SignupFooter() {
  return (
    <footer className="text-center pt-4">
      <p className="text-[#aca8c1] text-sm font-medium">
        Sudah memiliki akun?{" "}
        <Link
          href="/auth/login"
          className="text-primary-light font-bold transition-colors duration-200 hover:underline underline-offset-4 ml-1"
        >
          Masuk Sekarang
        </Link>
      </p>
    </footer>
  );
}
