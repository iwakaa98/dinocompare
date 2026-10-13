import {
  canBeBestOffer,
  classifyOfferKind,
  offerKindRank,
} from "../src/lib/offer-classification";

const cases: Array<{
  title: string;
  query: string;
  expectKind: ReturnType<typeof classifyOfferKind>;
  expectBest: boolean;
}> = [
  {
    title: "Panavia SA Cement Universal Tip Packung 20 Mixing Tips Regular",
    query: "Panavia SA",
    expectKind: "accessory",
    expectBest: false,
  },
  {
    title: "Panavia SA Cement Universal Intro Kit Handmix",
    query: "Panavia SA",
    expectKind: "kit",
    expectBest: true,
  },
  {
    title: "OptiBond FL Kit",
    query: "OptiBond FL",
    expectKind: "kit",
    expectBest: true,
  },
  {
    title: "Tokuyama Estelite Sigma Quick",
    query: "Tokuyama",
    expectKind: "other",
    expectBest: true,
  },
  {
    title: "3M Filtek Supreme XTE A2",
    query: "Filtek",
    expectKind: "other",
    expectBest: true,
  },
];

let failed = 0;

for (const row of cases) {
  const kind = classifyOfferKind(row.title, row.query);
  const best = canBeBestOffer(kind, row.query);
  const ok = kind === row.expectKind && best === row.expectBest;
  if (!ok) {
    failed += 1;
    console.error(
      `FAIL: "${row.query}" / "${row.title}" → kind=${kind} best=${best} (expected ${row.expectKind} / ${row.expectBest})`
    );
  }
}

const panaviaTips = classifyOfferKind(
  "Panavia mixing tips pack 20",
  "Panavia SA"
);
const panaviaKit = classifyOfferKind("Panavia SA intro kit", "Panavia SA");
if (offerKindRank(panaviaKit) >= offerKindRank(panaviaTips)) {
  failed += 1;
  console.error("FAIL: kit should rank above accessory for Panavia SA query");
}

if (failed > 0) {
  console.error(`\n${failed} trust QA check(s) failed.`);
  process.exit(1);
}

console.log("Trust QA: all checks passed.");
