import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seeds = [
  { query: "filtek z350 xt a2", productSlug: "filtek-z350-xt-a2", searchCount: 42 },
  { query: "optibond fl", productSlug: "optibond-fl", searchCount: 35 },
  { query: "septanest 1:100000", productSlug: "septodont-septanest", searchCount: 31 },
  { query: "gc fuji ix gp", productSlug: "gc-fuji-ix-gp", searchCount: 28 },
  { query: "composan lcm a2", productSlug: "composan-lcm-a2", searchCount: 24 },
  { query: "protaper next", productSlug: "dentsply-protaper-next", searchCount: 22 },
  { query: "variolink esthetic", productSlug: "ivoclar-variolink-esthetic", searchCount: 18 },
  { query: "metapaste", productSlug: "metapaste-meta", searchCount: 15 },
];

async function main() {
  for (const seed of seeds) {
    await prisma.productStat.upsert({
      where: { query: seed.query },
      create: seed,
      update: {
        searchCount: seed.searchCount,
        productSlug: seed.productSlug,
      },
    });
  }
  console.log(`Seeded ${seeds.length} popular products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
