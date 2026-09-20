"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Clock3, LogOut, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocalTime } from "@/components/local-time";

type RecentItem = {
  id: string;
  query: string;
  createdAt: string;
};

export function SiteHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [openRecent, setOpenRecent] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpenRecent(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenRecent(false);
  }, [pathname]);

  async function loadRecent() {
    if (!session?.user) return;
    setLoadingRecent(true);
    try {
      const res = await fetch("/api/recent");
      if (!res.ok) return;
      const data = await res.json();
      setRecent(data.items ?? []);
    } finally {
      setLoadingRecent(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)]/70 bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white shadow-[0_8px_24px_rgba(15,118,110,0.28)] transition group-hover:scale-[1.03]">
            DS
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
            DentSravni
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/#catalog"
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            Каталог
          </Link>
          <Link
            href="/#combo"
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            Комбинирай
          </Link>
          <Link
            href="/#how"
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            Как работи
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <div className="relative" ref={panelRef}>
              <button
                type="button"
                onClick={() => {
                  const next = !openRecent;
                  setOpenRecent(next);
                  if (next) void loadRecent();
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  openRecent
                    ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                )}
              >
                <Clock3 className="h-4 w-4" />
                <span className="hidden sm:inline">Скорошни</span>
              </button>

              {openRecent && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_20px_50px_rgba(15,40,40,0.12)]">
                  <div className="border-b border-[var(--line)] px-4 py-3">
                    <p className="text-sm font-medium text-[var(--ink)]">
                      Скорошни търсения
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {session.user.name ?? session.user.email}
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {loadingRecent && (
                      <p className="px-2 py-4 text-sm text-[var(--muted)]">
                        Зареждане…
                      </p>
                    )}
                    {!loadingRecent && recent.length === 0 && (
                      <p className="px-2 py-4 text-sm text-[var(--muted)]">
                        Все още няма търсения. Пробвайте продукт от каталога.
                      </p>
                    )}
                    {!loadingRecent &&
                      recent.map((item) => (
                        <Link
                          key={item.id}
                          href={`/?q=${encodeURIComponent(item.query)}`}
                          className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:bg-[var(--surface)]"
                          onClick={() => setOpenRecent(false)}
                        >
                          <Search className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                          <span>
                            <span className="block text-[var(--ink)]">
                              {item.query}
                            </span>
                            <span className="text-xs text-[var(--muted)]">
                              <LocalTime iso={item.createdAt} mode="datetime" />
                            </span>
                          </span>
                        </Link>
                      ))}
                  </div>
                  <div className="border-t border-[var(--line)] p-2">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                    >
                      <LogOut className="h-4 w-4" />
                      Изход
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition hover:text-[var(--ink)]"
              >
                Вход
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-deep)] sm:px-4"
              >
                Регистрация
              </Link>
            </div>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-[var(--ink)] md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Меню"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--line)] bg-[var(--bg)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link href="/#catalog" className="rounded-lg px-3 py-2 text-sm">
              Каталог
            </Link>
            <Link href="/#combo" className="rounded-lg px-3 py-2 text-sm">
              Комбинирай
            </Link>
            <Link href="/#how" className="rounded-lg px-3 py-2 text-sm">
              Как работи
            </Link>
            {session?.user ? (
              <>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm"
                  onClick={() => {
                    setOpenRecent(true);
                    void loadRecent();
                  }}
                >
                  Скорошни търсения
                </button>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm text-[var(--muted)]"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Изход
                </button>
              </>
            ) : null}
          </div>

          {session?.user && openRecent && (
            <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white p-2">
              {loadingRecent && (
                <p className="px-2 py-3 text-sm text-[var(--muted)]">Зареждане…</p>
              )}
              {!loadingRecent && recent.length === 0 && (
                <p className="px-2 py-3 text-sm text-[var(--muted)]">Няма скорошни.</p>
              )}
              {recent.map((item) => (
                <Link
                  key={item.id}
                  href={`/?q=${encodeURIComponent(item.query)}`}
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-[var(--surface)]"
                >
                  {item.query}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
