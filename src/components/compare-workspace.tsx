"use client";

import { useEffect, useState } from "react";
import { Layers3, Search } from "lucide-react";
import { ComboPlanner } from "@/components/combo-planner";
import { SearchPanel } from "@/components/search-panel";
import { readComboItems } from "@/lib/combo";
import { cn } from "@/lib/utils";

type Tab = "results" | "combo";

function tabFromHash(): Tab {
  if (typeof window === "undefined") return "results";
  return window.location.hash === "#combo" ? "combo" : "results";
}

export function CompareWorkspace({ query }: { query: string }) {
  const [tab, setTab] = useState<Tab>(query ? "results" : "combo");
  const [comboCount, setComboCount] = useState(0);

  useEffect(() => {
    setTab(tabFromHash());
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const sync = () => setComboCount(readComboItems().length);
    sync();
    window.addEventListener("dentsravni-combo", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("dentsravni-combo", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function go(next: Tab) {
    setTab(next);
    const hash = next === "combo" ? "#combo" : "#results";
    window.history.replaceState(null, "", `${window.location.search}${hash}`);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="mb-5 flex gap-2 rounded-2xl border border-[var(--line)] bg-white/70 p-1">
        <button
          type="button"
          onClick={() => go("results")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            tab === "results"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          )}
        >
          <Search className="h-4 w-4" />
          Резултати
          {query ? <span className="hidden max-w-[10rem] truncate sm:inline">· {query}</span> : null}
        </button>
        <button
          type="button"
          onClick={() => go("combo")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            tab === "combo"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          )}
        >
          <Layers3 className="h-4 w-4" />
          Комбинирай
          {comboCount > 0 ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{comboCount}</span>
          ) : null}
        </button>
      </div>

      <div className={tab === "results" ? "" : "hidden"}>
        {query ? (
          <SearchPanel query={query} />
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--line)] bg-white/60 px-6 py-12 text-center text-[var(--muted)]">
            Потърсете продукт отгоре. Резултатите остават тук, докато гледате количката.
          </div>
        )}
      </div>
      <div className={tab === "combo" ? "" : "hidden"}>
        <ComboPlanner />
      </div>
    </section>
  );
}
