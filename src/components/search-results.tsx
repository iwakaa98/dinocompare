"use client";

import { ExternalLink, Package, Truck, Warehouse } from "lucide-react";
import {
  remainingToFreeShipping,
  shopCheckoutInfo,
  shopInvoiceNote,
  type ProductOffer,
} from "@/lib/products";
import { supplierById } from "@/lib/combo";
import type { SearchResult } from "@/lib/products";
import { formatEur } from "@/lib/utils";
import { AddToComboButton } from "@/components/add-to-combo-button";
import { LocalTime } from "@/components/local-time";

function regionLabel(region: ProductOffer["region"]) {
  if (region === "BG") return "България";
  if (region === "EU") return "ЕС";
  return "Извън ЕС";
}

function OfferRow({
  offer,
  rank,
  product,
}: {
  offer: ProductOffer;
  rank: number;
  product: SearchResult["product"];
}) {
  const isBest = rank === 1 && offer.inStock;

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${
        !offer.inStock
          ? "border-amber-300/80 bg-amber-50/50"
          : isBest
            ? "border-[var(--accent)] bg-gradient-to-br from-white to-[var(--accent-soft)] shadow-[0_18px_50px_rgba(15,118,110,0.12)]"
            : "border-[var(--line)] bg-white/80"
      }`}
    >
      {isBest && (
        <p className="mb-3 inline-flex rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold tracking-wide text-white">
          Най-изгодна потвърдена оферта
        </p>
      )}
      {!offer.inStock && (
        <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-wide text-amber-900">
          Не е наличен в момента
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">
            #{rank} · {regionLabel(offer.region)} · доставка {offer.deliveryDays}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {offer.supplierName}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {offer.productName}
            {offer.packLabel && offer.packLabel !== offer.productName
              ? ` · ${offer.packLabel}`
              : ""}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-[var(--muted)]">Общо на касата</p>
          <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--accent-deep)]">
            {formatEur(offer.total)}
          </p>
          {!offer.inStock && (
            <p className="mt-1 text-xs font-medium text-amber-800">
              Цената е от сайта, но продуктът е изчерпан там
            </p>
          )}
          {offer.savingsVsWorst && offer.savingsVsWorst > 1 && (
            <p className="mt-1 text-xs font-medium text-[var(--accent)]">
              до {formatEur(offer.savingsVsWorst)} по-изгодно от най-скъпата оферта
            </p>
          )}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Package className="h-3.5 w-3.5" />
            Цена на продукта
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
            {formatEur(offer.price)}
          </dd>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Truck className="h-3.5 w-3.5" />
            Доставка
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
            {offer.shipping === 0 ? "Безплатна" : formatEur(offer.shipping)}
          </dd>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Warehouse className="h-3.5 w-3.5" />
            Такси и ДДС
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
            {offer.customs === 0 ? "0,00 €" : formatEur(offer.customs)}
          </dd>
        </div>
      </dl>

      {(offer.surcharge > 0 || offer.shopVat > 0) && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {offer.surcharge > 0
            ? `надбавка за малко количество ${formatEur(offer.surcharge)}`
            : null}
          {offer.surcharge > 0 && offer.shopVat > 0 ? " · " : null}
          {offer.shopVat > 0 ? `ДДС на магазина ${formatEur(offer.shopVat)}` : null}
        </p>
      )}
      {offer.customs > 0 && offer.shopVat === 0 && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          мито {formatEur(offer.duty)} · вносно ДДС {formatEur(offer.importVat)} ·
          куриер {formatEur(offer.clearanceFee)}
        </p>
      )}

      {offer.priceNote && (
        <p className="mt-3 text-xs font-medium leading-relaxed text-[var(--accent-deep)]">
          {offer.priceNote}
        </p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
        {offer.customsNote}
      </p>
      {(() => {
        const supplier = supplierById(offer.supplierId);
        if (!supplier) return null;
        const checkout = shopCheckoutInfo(supplier);
        const remaining = remainingToFreeShipping(supplier, offer.price);
        const invoiceNote = shopInvoiceNote(supplier);
        return (
          <div className="mt-3 space-y-1 text-xs leading-relaxed text-[var(--muted)]">
            {checkout.freeShippingFrom != null && (
              <p>
                Безплатна доставка от {checkout.freeShippingFrom} €
                {checkout.freeShippingIsNet ? " нето" : ""}
                {remaining && remaining > 0
                  ? ` · още ${formatEur(remaining)} до прага`
                  : remaining === 0
                    ? " · прагът е покрит"
                    : ""}
              </p>
            )}
            {invoiceNote && <p>{invoiceNote}</p>}
          </div>
        );
      })()}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={offer.productUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-deep)]"
        >
          {offer.linkLabel}
          <ExternalLink className="h-4 w-4" />
        </a>
        <AddToComboButton product={product} offer={offer} />
      </div>
    </article>
  );
}

function UncheckedShops({ result }: { result: SearchResult }) {
  if (result.uncheckedShops.length === 0) return null;
  return (
    <details className="rounded-3xl border border-[var(--line)] bg-white/70 p-5">
      <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]">
        Магазини без потвърдена цена ({result.uncheckedShops.length})
      </summary>
      <div className="mt-4 space-y-3">
        {result.uncheckedShops.map((shop) => (
          <div
            key={shop.supplierId}
            className="rounded-2xl bg-[var(--surface)] px-4 py-3"
          >
            <p className="font-medium text-[var(--ink)]">{shop.supplierName}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              {shop.reason}
            </p>
            <a
              href={shop.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-[var(--accent-deep)] hover:text-[var(--accent)]"
            >
              Отвори магазина
            </a>
          </div>
        ))}
      </div>
    </details>
  );
}

export function SearchResults({ result }: { result: SearchResult }) {
  if (result.bestOffers.length === 0) {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-white/60 px-6 py-12 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Няма потвърдена цена
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            За „{result.query}“ магазините още не върнаха продуктова страница
            с цена. Пробвайте отново след малко или по-краткото търговско име
            — например „Septanest“, „Filtek“, „OptiBond FL“.
          </p>
        </div>
        <UncheckedShops result={result} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="mb-2">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
          Резултати
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          {result.product.name}
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          {result.product.brand} · {result.product.category}. Показваме
          намерените варианти с потвърдена цена. Наличните са отгоре; изчерпаните
          остават видими, но не се броят за най-евтини.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          {result.priceDisclaimer}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Проверено: <LocalTime iso={result.checkedAt} mode="datetime" />
        </p>
      </div>

      {result.offers.map((offer, index) => (
        <OfferRow
          key={`${offer.supplierId}-${offer.productUrl}`}
          offer={offer}
          rank={index + 1}
          product={result.product}
        />
      ))}

      <UncheckedShops result={result} />
    </section>
  );
}
