import { prisma } from "@/lib/db";
import { fetchLiveOffers } from "@/lib/live-offers";
import { CATALOG, resolveProduct, round2 } from "@/lib/products";

const TOP_N = 10;

export async function refreshCatalogSnapshots(): Promise<{
  refreshed: number;
  errors: string[];
}> {
  const stats = await prisma.productStat.findMany({
    orderBy: [{ searchCount: "desc" }, { lastSearched: "desc" }],
    take: TOP_N,
  });

  const errors: string[] = [];
  let refreshed = 0;

  for (const stat of stats) {
    if (stat.searchCount < 1) continue;
    const product =
      CATALOG.find((item) => item.slug === stat.productSlug) ??
      resolveProduct(stat.query);
    if (product.brand === "Общо търсене") continue;

    const liveQuery =
      product.slug === "septodont-septanest" &&
      !/1\s*[:/]\s*200/.test(stat.query)
        ? product.searchQuery
        : stat.query;

    try {
      const live = await fetchLiveOffers(liveQuery);
      const offers = live.offers.filter((o) => o.inStock);
      const compare = offers.length ? offers : live.offers;
      const best = compare[0]?.total ?? null;
      const worst = compare[compare.length - 1]?.total ?? null;
      const savingsEur =
        best != null && worst != null ? round2(Math.max(0, worst - best)) : null;

      await prisma.catalogSnapshot.upsert({
        where: { productSlug: product.slug },
        create: {
          productSlug: product.slug,
          searchQuery: product.searchQuery || product.name,
          searchCount: stat.searchCount,
          bestTotal: best,
          worstTotal: worst,
          savingsEur,
          offerCount: live.offers.length,
          refreshedAt: new Date(),
        },
        update: {
          searchQuery: product.searchQuery || product.name,
          searchCount: stat.searchCount,
          bestTotal: best,
          worstTotal: worst,
          savingsEur,
          offerCount: live.offers.length,
          refreshedAt: new Date(),
        },
      });
      refreshed += 1;
    } catch (error) {
      errors.push(
        `${product.slug}: ${error instanceof Error ? error.message : "error"}`
      );
    }
  }

  return { refreshed, errors };
}
