import Link from "next/link";

export default function LoginFooter() {
  return (
    <footer className="mt-12 text-center">
      <p className="text-[#aca8c1] font-medium">
        Belum punya akun?{" "}

        <Link
          href="/auth/role"
          className="text-primary-light font-bold transition-colors duration-200 hover:underline underline-offset-4 ml-1"
        >
          Daftar
        </Link>
      </p>
    </footer>
  );
}
