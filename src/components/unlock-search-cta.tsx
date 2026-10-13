"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { PRICING } from "@/lib/pricing";

export function UnlockSearchCta({ savingsEur }: { savingsEur?: number }) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: "pro" | "clinic") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Грешка при плащане.");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;

  return (
    <div className="rounded-3xl border border-[var(--accent)]/40 bg-gradient-to-br from-white to-[var(--accent-soft)] p-6">
      <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        Отключете пълното сравнение
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {savingsEur && savingsEur > 1
          ? `За това търсене разликата между офертите е до ${savingsEur.toFixed(2)} €. `
          : ""}
        С Pro виждате всички магазини, реални линкове и Комбинирай.
      </p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        {!session?.user ? (
          <>
            <Link
              href="/register"
              className="inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white"
            >
              Регистрация
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm"
            >
              Вход
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => checkout("pro")}
              className="inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              Pro · {PRICING.pro.priceEur} €/мес.
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => checkout("clinic")}
              className="inline-flex rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm disabled:opacity-60"
            >
              Clinic · {PRICING.clinic.priceEur} €/мес.
            </button>
          </>
        )}
        <Link href="/pricing" className="inline-flex items-center px-2 text-sm text-[var(--accent-deep)] underline">
          Всички планове
        </Link>
      </div>
    </div>
  );
}
