import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <Link
        href="/"
        className="mb-6 text-sm text-[var(--muted)] transition hover:text-[var(--ink)]"
      >
        ← Начало
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Създайте акаунт
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Безплатно засега — готови сме за subscription модел, когато ви е
        нужно.
      </p>
      <div className="mt-8 rounded-3xl border border-[var(--line)] bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,60,55,0.06)]">
        <RegisterForm />
      </div>
    </div>
  );
}
