"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { SearchResult } from "@/lib/products";
import { SearchResults } from "@/components/search-results";

export function SearchPanel({ query }: { query: string }) {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Търсенето не успя.");
        }
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setResult(null);
          setError(err instanceof Error ? err.message : "Грешка при търсене.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (!query.trim()) return null;

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-3xl border border-[var(--line)] bg-white/70 px-6 py-16 text-[var(--muted)]">
        <LoaderCircle className="h-5 w-5 animate-spin text-[var(--accent)]" />
        Търсим в магазините и в резултатите от търсачките…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700">
        {error}
      </div>
    );
  }

  if (!result) return null;
  return <SearchResults result={result} />;
}
