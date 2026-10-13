"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

export function ManageSubscriptionButton({
  className,
  label = "Абонамент",
}: {
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Порталът не е наличен.");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={loading}
        onClick={openPortal}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:opacity-60"
      >
        <CreditCard className="h-4 w-4" />
        {loading ? "Отваряне…" : label}
      </button>
      {error && <p className="px-3 py-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
