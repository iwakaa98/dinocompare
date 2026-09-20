"use client";

import { useEffect, useState } from "react";
import { Layers3 } from "lucide-react";
import { addComboItem, comboItemFromOffer, readComboItems } from "@/lib/combo";
import type { CatalogProduct, ProductOffer } from "@/lib/products";

export function AddToComboButton({
  product,
  offer,
}: {
  product: Pick<CatalogProduct, "slug" | "name" | "unit">;
  offer: ProductOffer;
}) {
  const [status, setStatus] = useState<"idle" | "added" | "conflict">("idle");
  const [otherShop, setOtherShop] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const current = readComboItems();
      const other = current.find((item) => item.supplierId !== offer.supplierId);
      const same = current.some(
        (item) =>
          item.supplierId === offer.supplierId &&
          (item.slug === product.slug || item.packLabel === offer.packLabel)
      );
      setOtherShop(other?.supplierName ?? null);
      if (same && !other) setStatus("added");
    };
    sync();
    window.addEventListener("dentsravni-combo", sync);
    return () => window.removeEventListener("dentsravni-combo", sync);
  }, [offer.packLabel, offer.supplierId, product.slug]);

  function add(replaceShop = false) {
    const result = addComboItem(comboItemFromOffer(product, offer), {
      replaceShop,
    });
    setStatus(result.sameShop ? "added" : "conflict");
    if (!result.sameShop) {
      const other = result.items.find((item) => item.supplierId !== offer.supplierId);
      setOtherShop(other?.supplierName ?? "друг магазин");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => add(false)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--accent)]/40"
      >
        <Layers3 className="h-4 w-4 text-[var(--accent)]" />
        {status === "added"
          ? `В количката на ${offer.supplierName}`
          : `Добави в ${offer.supplierName}`}
      </button>
      {status === "conflict" && otherShop && (
        <div className="rounded-2xl bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]">
          Количката е за {otherShop}. Комбинираме само от един сайт.
          <button
            type="button"
            className="ml-2 font-medium text-[var(--accent-deep)] underline"
            onClick={() => add(true)}
          >
            Смени към {offer.supplierName}
          </button>
        </div>
      )}
    </div>
  );
}
