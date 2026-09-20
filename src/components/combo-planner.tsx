"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Layers3, Minus, Plus, Trash2 } from "lucide-react";
import {
  quoteComboGroups,
  readComboItems,
  setComboQty,
  writeComboItems,
  type ComboItem,
} from "@/lib/combo";
import { formatEur } from "@/lib/utils";

export function ComboPlanner() {
  const [items, setItems] = useState<ComboItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readComboItems());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("dentsravni-combo", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("dentsravni-combo", sync);
    };
  }, []);

  const quotes = useMemo(() => quoteComboGroups(items), [items]);
  const shop = items[0];
  const quote = quotes[0];

  function changeQty(item: ComboItem, qty: number) {
    setComboQty(item, qty);
  }

  return (
    <section
      id="combo"
      className="scroll-mt-24 rounded-3xl border border-[var(--line)] bg-white/75 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <Layers3 className="mt-1 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Количка от един магазин
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Добавяте продукти само от един сайт. Смятаме една доставка и една
            митническа такса — колкото бихте платили, ако поръчате заедно.
          </p>
        </div>
      </div>

      {items.length === 0 || !shop ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          От резултатите натиснете „Добави в [магазин]“. Ако смените сайта,
          количката се заменя.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-deep)]">
            Поръчка към {shop.supplierName}
          </p>

          {items.map((item) => (
            <div
              key={`${item.supplierId}-${item.slug}-${item.packLabel}`}
              className="flex flex-col gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-[var(--ink)]">{item.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {item.packLabel} · {formatEur(item.price)} / бр. · ред{" "}
                  {formatEur(item.price * (item.qty || 1))}
                </p>
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-deep)]"
                >
                  Отвори продукта <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--line)] bg-white p-1.5"
                  onClick={() => changeQty(item, item.qty - 1)}
                  aria-label="Намали"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">
                  {item.qty}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--line)] bg-white p-1.5"
                  onClick={() => changeQty(item, item.qty + 1)}
                  aria-label="Увеличи"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => changeQty(item, 0)}
                  className="rounded-lg p-2 text-[var(--muted)] hover:bg-white"
                  aria-label="Премахни"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {quote && (
            <div className="rounded-2xl border border-[var(--accent)]/30 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Ако поръчате сега от {quote.supplierName}
              </p>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt>Продукти</dt>
                  <dd>{formatEur(quote.goods)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Една доставка</dt>
                  <dd>
                    {quote.combinedShipping === 0
                      ? "Безплатна"
                      : formatEur(quote.combinedShipping)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Митница / куриер за пратката</dt>
                  <dd>
                    {quote.combinedCustoms === 0
                      ? "0,00 €"
                      : formatEur(quote.combinedCustoms)}
                  </dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-[var(--line)] pt-2 font-[family-name:var(--font-display)] text-xl text-[var(--accent-deep)]">
                  <dt>Ще платите общо</dt>
                  <dd>{formatEur(quote.combinedTotal)}</dd>
                </div>
              </dl>
              {quote.freeShippingFrom != null && (
                <p className="mt-3 rounded-xl bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)]">
                  {quote.combinedShipping === 0
                    ? `Безплатна доставка: прагът от ${quote.freeShippingFrom} €${
                        quote.freeShippingIsNet ? " нето" : ""
                      } е покрит.`
                    : `Безплатна доставка от ${quote.freeShippingFrom} €${
                        quote.freeShippingIsNet ? " нето" : ""
                      }${
                        quote.remainingToFree
                          ? ` · добавете още ${formatEur(quote.remainingToFree)}`
                          : ""
                      }`}
                </p>
              )}
              {quote.issuesEuInvoice && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Този магазин издава фактура към българска фирма с ДДС номер.
                  Въведете BG ДДС номера в профила на сайта, за да е reverse
                  charge вместо 19% немски ДДС.
                </p>
              )}
              {quote.saved > 0.5 && (
                <p className="mt-2 text-xs text-[var(--accent)]">
                  Срещу отделни пратки спестявате {formatEur(quote.saved)}.
                </p>
              )}
              {quote.reasons.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
                  {quote.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
              {quote.region === "INTL" && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Китай / извън ЕС: мито и куриерска такса са за цялата пратка,
                  не за всеки артикул поотделно.
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => writeComboItems([])}
            className="text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
          >
            Изчисти количката
          </button>
        </div>
      )}
    </section>
  );
}
