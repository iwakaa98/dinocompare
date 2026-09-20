import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";

type CatalogItem = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  description: string;
  searchCount: number;
  bestTotal: number | null;
  bestSupplier: string;
  offerCount: number;
};

type Props = {
  items: CatalogItem[];
  refreshedAt: string;
  nextRefreshAt: string;
  ttlMinutes: number;
  cached: boolean;
};

export function PopularCatalog({
  items,
  refreshedAt,
  nextRefreshAt,
  ttlMinutes,
  cached,
}: Props) {
  return (
    <section id="catalog" className="scroll-mt-24">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Каталог
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            Най-търсени в кабинета
          </h2>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Кликването търси на живо по името на продукта и отваря реалните
            продуктови страници. Каталогът се обновява на {ttlMinutes} минути.
          </p>
        </div>
        <div className="inline-flex items-start gap-2 rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-2 text-xs text-[var(--muted)]">
          <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <span>
            {cached ? "От кеш" : "Прясно обновено"} ·{" "}
            {new Date(refreshedAt).toLocaleTimeString("bg-BG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            <br />
            следващо:{" "}
            {new Date(nextRefreshAt).toLocaleTimeString("bg-BG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <Link
            key={item.slug}
            href={`/?q=${encodeURIComponent(item.name)}`}
            className="group relative block overflow-hidden rounded-3xl border border-[var(--line)] bg-white/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[0_18px_40px_rgba(15,80,70,0.1)]"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
                {item.category}
              </p>
              <ArrowUpRight className="h-4 w-4 text-[var(--muted)] transition group-hover:text-[var(--accent)]" />
            </div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--ink)]">
              {item.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {item.brand} · {item.unit}
            </p>
            <p className="mt-4 text-sm font-medium text-[var(--accent-deep)]">
              Сравни на живо
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {item.searchCount > 0
                ? `${item.searchCount} търсения`
                : "отваря актуални продуктови страници"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
