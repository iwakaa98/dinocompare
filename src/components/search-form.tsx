"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle, Search } from "lucide-react";

type Props = {
  initialQuery?: string;
  autofocus?: boolean;
  compact?: boolean;
};

export function SearchForm({
  initialQuery = "",
  autofocus = false,
  compact = false,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    startTransition(() => {
      router.push(`/?q=${encodeURIComponent(q)}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? "flex w-full gap-2"
          : "mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
      }
    >
      <label className="relative flex-1">
        <span className="sr-only">Търсене на зъболекарски продукт</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autofocus}
          placeholder="напр. Filtek Z350, OptiBond FL, Septanest…"
          className="w-full rounded-2xl border border-[var(--line)] bg-white/90 py-3.5 pl-12 pr-4 text-[var(--ink)] shadow-[0_10px_40px_rgba(15,60,55,0.06)] outline-none ring-[var(--accent)] transition placeholder:text-[var(--muted)] focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !query.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--action)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(192,86,33,0.28)] transition hover:bg-[var(--action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        Сравни цени
      </button>
    </form>
  );
}
