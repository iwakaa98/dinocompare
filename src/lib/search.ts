import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fetchLiveOffers } from "@/lib/live-offers";
import {
  CATALOG,
  PRICE_DISCLAIMER,
  resolveProduct,
  type CatalogProduct,
  type ProductOffer,
  type UncheckedShop,
} from "@/lib/products";
import { slugify } from "@/lib/utils";

export type SearchResult = {
  query: string;
  product: CatalogProduct;
  offers: ProductOffer[];
  bestOffers: ProductOffer[];
  checkedAt: string;
  suppliersChecked: number;
  priceDisclaimer: string;
  uncheckedShops: UncheckedShop[];
};

const catalogCache = new Map<
  string,
  { expiresAt: number; payload: Awaited<ReturnType<typeof computePopularCatalog>> }
>();

const CACHE_TTL_MS = 7 * 60 * 1000;

export async function runProductSearch(query: string): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Въведете име на продукт.");
  }

  const product = resolveProduct(trimmed);
  const live = await fetchLiveOffers(trimmed);
  const offers = live.offers;
  const bestOffers = offers.slice(0, 10);
  const uncheckedShops = live.uncheckedShops;

  const session = await auth();
  if (session?.user?.id) {
    const recentDuplicate = await prisma.searchHistory.findFirst({
      where: {
        userId: session.user.id,
        query: trimmed,
        createdAt: { gte: new Date(Date.now() - 20_000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!recentDuplicate) {
      await prisma.searchHistory.create({
        data: {
          userId: session.user.id,
          query: trimmed,
          productSlug: product.slug,
        },
      });
    }
  }

  const existingStat = await prisma.productStat.findUnique({
    where: { query: trimmed.toLowerCase() },
  });

  if (!existingStat) {
    await prisma.productStat.create({
      data: {
        query: trimmed.toLowerCase(),
        productSlug: product.slug || slugify(trimmed),
        searchCount: 1,
        lastSearched: new Date(),
      },
    });
  } else {
    const freshlyUpdated =
      Date.now() - existingStat.lastSearched.getTime() < 20_000;
    await prisma.productStat.update({
      where: { query: trimmed.toLowerCase() },
      data: {
        searchCount: freshlyUpdated
          ? existingStat.searchCount
          : { increment: 1 },
        lastSearched: new Date(),
        productSlug: product.slug || slugify(trimmed),
      },
    });
  }
  catalogCache.clear();

  return {
    query: trimmed,
    product,
    offers,
    bestOffers,
    checkedAt: new Date().toISOString(),
    suppliersChecked: live.offers.length + live.uncheckedShops.length,
    priceDisclaimer: PRICE_DISCLAIMER,
    uncheckedShops,
  };
}

async function computePopularCatalog() {
  const stats = await prisma.productStat.findMany({
    orderBy: [{ searchCount: "desc" }, { lastSearched: "desc" }],
    take: 8,
  });

  const source =
    stats.length === 0
      ? CATALOG.slice(0, 8).map((product) => ({ product, searchCount: 0 }))
      : stats.map((stat) => ({
          product:
            CATALOG.find((p) => p.slug === stat.productSlug) ??
            resolveProduct(stat.query),
          searchCount: stat.searchCount,
        }));

  return source.map(({ product, searchCount }) => ({
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    unit: product.unit,
    description: product.description,
    searchCount,
    bestTotal: null as number | null,
    bestSupplier: "на живо при търсене",
    offerCount: 0,
  }));
}

export async function getPopularCatalog() {
  const cached = catalogCache.get("popular");
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return {
      items: cached.payload,
      cached: true,
      refreshedAt: new Date(cached.expiresAt - CACHE_TTL_MS).toISOString(),
      nextRefreshAt: new Date(cached.expiresAt).toISOString(),
      ttlMinutes: Math.round(CACHE_TTL_MS / 60000),
    };
  }

  const payload = await computePopularCatalog();
  catalogCache.set("popular", {
    expiresAt: now + CACHE_TTL_MS,
    payload,
  });

  return {
    items: payload,
    cached: false,
    refreshedAt: new Date(now).toISOString(),
    nextRefreshAt: new Date(now + CACHE_TTL_MS).toISOString(),
    ttlMinutes: Math.round(CACHE_TTL_MS / 60000),
  };
}

export async function getRecentSearches(userId: string, limit = 12) {
  return prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
