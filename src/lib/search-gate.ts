import type { ProductOffer, SearchResult } from "@/lib/products";
import { round2 } from "@/lib/products";

function redactOffer(offer: ProductOffer): ProductOffer {
  return {
    ...offer,
    productName: "Продукт (Pro)",
    packLabel: "",
    productUrl: "",
    linkLabel: "Отключи Pro",
    price: 0,
    shipping: 0,
    surcharge: 0,
    shopVat: 0,
    customs: 0,
    duty: 0,
    importVat: 0,
    clearanceFee: 0,
    customsNote: "",
    priceNote: undefined,
    savingsVsWorst: undefined,
  };
}

export function applySearchPaywall(
  result: Omit<SearchResult, "locked" | "maxSavingsEur" | "confirmedOfferCount">,
  fullAccess: boolean
): SearchResult {
  const stocked = result.offers.filter((o) => o.inStock);
  const compare = stocked.length ? stocked : result.offers;
  const best = compare[0]?.total ?? 0;
  const worst = compare[compare.length - 1]?.total ?? 0;
  const maxSavingsEur = round2(Math.max(0, worst - best));
  const confirmedOfferCount = result.offers.length;

  if (fullAccess) {
    return {
      ...result,
      locked: false,
      maxSavingsEur,
      confirmedOfferCount,
    };
  }

  const teaser = result.offers.slice(0, 2).map(redactOffer);

  return {
    ...result,
    offers: teaser,
    bestOffers: teaser,
    locked: true,
    maxSavingsEur,
    confirmedOfferCount,
    uncheckedShops: [],
  };
}
