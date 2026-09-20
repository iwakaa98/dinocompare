export type SupplierRegion = "BG" | "EU" | "INTL";
export type OfferLinkKind = "product" | "search";

export type Supplier = {
  id: string;
  name: string;
  url: string;
  region: SupplierRegion;
  publicShop: boolean;
  vatIncludedInPrice: boolean;
  iossLikely: boolean;
  listedPriceIsNet?: boolean;
  sourceVatRate?: number;
  minOrderNet?: number;
  minOrderFeeNet?: number;
  shippingNet?: number;
  freeShippingFromNet?: number;
  issuesEuInvoice?: boolean;
  searchUrl: (query: string) => string;
  note: string;
};

export type CustomsBreakdown = {
  duty: number;
  vat: number;
  clearance: number;
  amount: number;
  note: string;
};

export type ProductOffer = {
  supplierId: string;
  supplierName: string;
  supplierUrl: string;
  region: SupplierRegion;
  productName: string;
  packLabel: string;
  productUrl: string;
  linkKind: OfferLinkKind;
  linkLabel: string;
  inStock: boolean;
  currency: "EUR";
  price: number;
  priceKind: "listed" | "estimate";
  priceNote?: string;
  shipping: number;
  surcharge: number;
  shopVat: number;
  customs: number;
  duty: number;
  importVat: number;
  clearanceFee: number;
  customsNote: string;
  total: number;
  deliveryDays: string;
  savingsVsWorst?: number;
};

export type UncheckedShop = {
  supplierId: string;
  supplierName: string;
  url: string;
  reason: string;
};

export type CatalogProduct = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  description: string;
  aliases: string[];
  searchQuery: string;
};

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

export const BG_FREE_SHIPPING_FROM = 60;
export const EU_DUTY_DE_MINIMIS_EUR = 150;
export const EU_LOW_VALUE_DUTY_EUR = 3;
export const BG_IMPORT_VAT = 0.2;
export const COURIER_CLEARANCE_EUR = 7.62;

function searchParam(query: string) {
  return encodeURIComponent(query.trim());
}

function shop(
  id: string,
  name: string,
  url: string,
  region: SupplierRegion,
  searchUrl: (query: string) => string,
  extra?: Partial<Supplier>
): Supplier {
  return {
    id,
    name,
    url,
    region,
    publicShop: true,
    vatIncludedInPrice: extra?.vatIncludedInPrice ?? region !== "INTL",
    iossLikely: extra?.iossLikely ?? false,
    listedPriceIsNet: extra?.listedPriceIsNet,
    sourceVatRate: extra?.sourceVatRate,
    minOrderNet: extra?.minOrderNet,
    minOrderFeeNet: extra?.minOrderFeeNet,
    shippingNet: extra?.shippingNet,
    freeShippingFromNet: extra?.freeShippingFromNet,
    issuesEuInvoice: extra?.issuesEuInvoice,
    searchUrl,
    note:
      extra?.note ??
      (region === "BG"
        ? "Български магазин. Доставка в страната."
        : region === "EU"
          ? "ЕС магазин. Доставка към BG е вътрешнообщностна."
          : "Извън ЕС. Смятаме митница и куриер към България."),
  };
}

const deB2b = {
  listedPriceIsNet: true,
  vatIncludedInPrice: false,
  sourceVatRate: 0.19,
  minOrderNet: 50,
  minOrderFeeNet: 5,
  shippingNet: 7.95,
  freeShippingFromNet: 250,
  issuesEuInvoice: true,
  note: "Немски B2B. Фактура към фирма става с име, адрес и Булстат. Без ДДС номер касата слага 19%. Reverse charge е само с BG ДДС номер.",
} as const;

export const SUPPLIERS: Supplier[] = [
  shop("patricia", "Patricia Dental", "https://patricia.bg", "BG", (q) =>
    `https://patricia.bg/catalogsearch/result/?q=${searchParam(q)}`
  ),
  shop("dentstore", "Dentstore", "https://dentstore.bg", "BG", (q) =>
    `https://dentstore.bg/cautare?s=${searchParam(q)}`
  ),
  shop("buldent", "BulDent", "https://buldent.bg", "BG", (q) =>
    `https://buldent.bg/?s=${searchParam(q)}&post_type=product`
  ),
  shop("veamed", "Veamed", "https://www.veamed.bg", "BG", (q) =>
    `https://www.veamed.bg/?s=${searchParam(q)}`
  ),
  shop("belvezar", "Belvezar", "https://www.belvezar.com", "BG", (q) => {
    const slug = q
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
    return `https://www.belvezar.com/${slug || searchParam(q)}.html`;
  }),
  shop(
    "klapperzaehnchen",
    "Klapperzähnchen",
    "https://klapperzaehnchen.de",
    "EU",
    (q) => `https://klapperzaehnchen.de/suggest?search=${searchParam(q)}`,
    deB2b
  ),
  shop("cutdental", "CUT Dental", "https://cut-dental.de", "EU", (q) =>
    `https://cut-dental.de/suggest?search=${searchParam(q)}`,
    deB2b
  ),
  shop("dentalshop", "DentalShop.bg", "https://dentalshop.bg", "BG", (q) =>
    `https://dentalshop.bg/?s=${searchParam(q)}`
  ),
  shop("dentacon", "Дентакон", "https://shop.dentaconbg.com", "BG", (q) =>
    `https://shop.dentaconbg.com/index.php?route=product/search&search=${searchParam(q)}`
  ),
  shop("medicplus", "Medicplus", "https://medicplus.bg", "BG", (q) =>
    `https://medicplus.bg/?s=${searchParam(q)}`
  ),
  shop("denta", "Denta.bg", "https://denta.bg", "BG", (q) =>
    `https://denta.bg/?s=${searchParam(q)}`
  ),
  shop("dentcommerce", "Dentcommerce", "https://www.dentcommerce.bg", "BG", (q) =>
    `https://www.dentcommerce.bg/?s=${searchParam(q)}`
  ),
  shop("bgdent", "BG Dent", "https://www.bg-dent.com", "BG", (q) =>
    `https://www.bg-dent.com/?s=${searchParam(q)}`
  ),
  shop("dentalsystem", "Dental System", "https://dentalsystem.bg", "BG", (q) =>
    `https://dentalsystem.bg/?s=${searchParam(q)}`
  ),
  shop("stoma", "Stoma.bg", "https://www.stoma.bg", "BG", (q) =>
    `https://www.stoma.bg/?s=${searchParam(q)}`
  ),
  shop(
    "dentaldirect",
    "Dental Direct ES",
    "https://www.dentaldirect.es",
    "EU",
    (q) => `https://www.dentaldirect.es/en/search?q=${searchParam(q)}`
  ),
  shop("dentaltix", "Dentaltix", "https://www.dentaltix.com", "EU", (q) =>
    `https://www.dentaltix.com/es/search?q=${searchParam(q)}`
  ),
  shop(
    "promodentaire",
    "Promo Dentaire",
    "https://www.promo-dentaire.com",
    "EU",
    (q) =>
      `https://www.promo-dentaire.com/recherche?controller=search&s=${searchParam(q)}`
  ),
  shop("dentaleshop", "DentaleShop", "https://www.dentaleshop.fr", "EU", (q) =>
    `https://www.dentaleshop.fr/recherche?controller=search&s=${searchParam(q)}`
  ),
  shop("amazonde", "Amazon.de", "https://www.amazon.de", "EU", (q) =>
    `https://www.amazon.de/s?k=${searchParam(`${q} dental`)}`
  ),
  shop("temu", "Temu", "https://www.temu.com", "INTL", (q) =>
    `https://www.temu.com/search_result.html?search_key=${searchParam(`${q} dental`)}`,
    {
      vatIncludedInPrice: true,
      iossLikely: true,
      note: "Извън ЕС. Често събира ДДС предварително; мито и куриер остават.",
    }
  ),
];

export const CATALOG: CatalogProduct[] = [
  {
    slug: "composan-lcm-a2",
    name: "Composan LCM A2",
    brand: "Promedica",
    category: "Композити",
    unit: "4 g спринцовка",
    description: "Светлиннополимеризиращ композит за директни реставрации.",
    aliases: ["composan", "composan lcm", "композит a2", "promedica composan"],
    searchQuery: "Composan LCM A2",
  },
  {
    slug: "filtek-z350-xt-a2",
    name: "Filtek Z350 XT A2",
    brand: "3M / Solventum",
    category: "Композити",
    unit: "4 g спринцовка",
    description:
      "Нанокомпозит Filtek. В ЕС често се продава като Filtek Ultimate / Supreme XT.",
    aliases: ["filtek", "z350", "3m filtek", "филтек", "filtek ultimate"],
    searchQuery: "Filtek Ultimate A2",
  },
  {
    slug: "tokuyama-estelite-asteria",
    name: "Tokuyama Estelite Asteria",
    brand: "Tokuyama",
    category: "Композити",
    unit: "спринцовка / сет",
    description:
      "Нанокомпозит Estelite Asteria. Търсенето „Tokuyama“ показва и Sigma Quick и други линии.",
    aliases: [
      "tokuyama",
      "токуяма",
      "estelite",
      "естелайт",
      "estelait",
      "asteria",
      "астерия",
      "sigma quick",
    ],
    searchQuery: "Tokuyama",
  },
  {
    slug: "optibond-fl",
    name: "OptiBond FL",
    brand: "Kerr",
    category: "Адхезиви",
    unit: "Kit 8 ml + 8 ml",
    description: "Двукомпонентен адхезив за емайл и дентин.",
    aliases: ["optibond", "optibond fl", "кер адхезив"],
    searchQuery: "OptiBond FL",
  },
  {
    slug: "ultradent-opalustre",
    name: "Opalustre",
    brand: "Ultradent",
    category: "Избелване / микроабразия",
    unit: "1.2 ml спринцовка",
    description: "Паста за микроабразия при петна по емайла.",
    aliases: ["opalustre", "ultradent opalustre", "микроабразия"],
    searchQuery: "Ultradent Opalustre",
  },
  {
    slug: "gc-fuji-ix-gp",
    name: "GC Fuji IX GP",
    brand: "GC",
    category: "Гласйономер",
    unit: "капсули / прах-течност",
    description: "Високоякостен гласйономерен цимент за задни реставрации.",
    aliases: ["fuji ix", "gc fuji", "гласйономер", "fuji 9"],
    searchQuery: "GC Fuji IX",
  },
  {
    slug: "septodont-septanest",
    name: "Septanest",
    brand: "Septodont",
    category: "Анестезия",
    unit: "50 карпули · 1:100000 / 1:200000",
    description:
      "Артикаин с адреналин. 1:100000 е по-често за кабинета; 1:200000 също се показва.",
    aliases: [
      "septanest",
      "септанест",
      "арти каин",
      "артикаин",
      "анестезия карпули",
      "septodont",
    ],
    searchQuery: "Septanest",
  },
  {
    slug: "dentsply-protaper-next",
    name: "ProTaper Next Assortment",
    brand: "Dentsply Sirona",
    category: "Ендодонтия",
    unit: "Асортимент X1–X3",
    description: "NiTi ротационни пили за машинна ендодонтия.",
    aliases: ["protaper", "protaper next", "ендо пили", "niti"],
    searchQuery: "ProTaper Next",
  },
  {
    slug: "ivoclar-variolink-esthetic",
    name: "Variolink Esthetic DC",
    brand: "Ivoclar",
    category: "Цименти",
    unit: "5 g спринцовка",
    description: "Двойнополимеризиращ композитен цимент за фасети и корони.",
    aliases: ["variolink", "ivoclar variolink", "композитен цимент"],
    searchQuery: "Variolink Esthetic DC",
  },
  {
    slug: "coltene-hygenic-wedjets",
    name: "Hygenic Wedjets",
    brand: "Coltene",
    category: "Изолация",
    unit: "опаковка 100 бр.",
    description: "Латексови клинове за кофердам изолация.",
    aliases: ["wedjets", "кофердам клинове", "hygenic"],
    searchQuery: "Hygenic Wedjets",
  },
  {
    slug: "kerr-take-1-advanced",
    name: "Take 1 Advanced",
    brand: "Kerr",
    category: "Отпечатъчни материали",
    unit: "2 × 50 ml",
    description: "VPS материал за прецизни отпечатъци.",
    aliases: ["take 1", "take1", "отпечатка kerr", "vps"],
    searchQuery: "Kerr Take 1 Advanced",
  },
  {
    slug: "biolase-ezlase-tips",
    name: "Epic Diode Tips 400µm",
    brand: "BIOLASE",
    category: "Лазерни консумативи",
    unit: "20 накрайника",
    description: "Еднократни накрайници за диоден лазер.",
    aliases: ["biolase tips", "диоден лазер tips", "epic tips"],
    searchQuery: "BIOLASE Epic diode tips",
  },
  {
    slug: "metapaste-meta",
    name: "Metapaste",
    brand: "Meta Biomed",
    category: "Ендодонтия",
    unit: "2.2 g спринцовка",
    description: "Калциев хидроксид паста за временна коренова обтурация.",
    aliases: ["metapaste", "калциев хидроксид", "meta paste"],
    searchQuery: "Meta Biomed Metapaste",
  },
];

export function shopCheckoutInfo(supplier: Supplier) {
  const from =
    supplier.freeShippingFromNet ??
    (supplier.region === "BG" ? BG_FREE_SHIPPING_FROM : null);
  return {
    freeShippingFrom: from,
    freeShippingIsNet: Boolean(supplier.freeShippingFromNet) || supplier.region === "BG",
    issuesEuInvoice: Boolean(supplier.issuesEuInvoice),
  };
}

export function shopInvoiceNote(supplier: Supplier) {
  if (!supplier.issuesEuInvoice) return null;
  return "Фактура към българска фирма: да, с име, адрес и Булстат/ЕИК. Без регистрация по ДДС касата слага 19% немски ДДС — така са сметнати и нашите суми. Reverse charge без този 19% става само с валиден BG ДДС номер в профила на магазина.";
}

export function remainingToFreeShipping(supplier: Supplier, goodsEur: number) {
  const info = shopCheckoutInfo(supplier);
  if (info.freeShippingFrom == null) return null;
  return round2(Math.max(0, info.freeShippingFrom - goodsEur));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function shippingForShipment(
  region: SupplierRegion,
  goodsEur: number
): number {
  if (region === "BG") {
    if (goodsEur >= BG_FREE_SHIPPING_FROM) return 0;
    return 3.5;
  }
  if (region === "EU") {
    return round2(7.6 + goodsEur * 0.012);
  }
  return round2(11.25 + goodsEur * 0.03);
}

export function customsForShipment(
  supplier: Pick<Supplier, "region" | "vatIncludedInPrice" | "iossLikely">,
  goodsEur: number,
  shipping: number,
  itemCount = 1
): CustomsBreakdown {
  if (supplier.region === "BG" || supplier.region === "EU") {
    return {
      duty: 0,
      vat: 0,
      clearance: 0,
      amount: 0,
      note: "В ЕС няма митница. ДДС обикновено вече е в цената на магазина.",
    };
  }

  const items = Math.max(1, itemCount);
  const dutiable = goodsEur + shipping;
  const lowValue = dutiable <= EU_DUTY_DE_MINIMIS_EUR;
  const duty = lowValue ? round2(EU_LOW_VALUE_DUTY_EUR * items) : 0;
  const vat = supplier.vatIncludedInPrice
    ? 0
    : round2((dutiable + duty) * BG_IMPORT_VAT);
  const clearance = COURIER_CLEARANCE_EUR;
  const amount = round2(duty + vat + clearance);

  const parts = [
    lowValue
      ? `от 1.07.2026 г. временно мито €${EU_LOW_VALUE_DUTY_EUR}/артикул за пратки до €${EU_DUTY_DE_MINIMIS_EUR}`
      : "над €150: за типични дентални материали (HS 3006.40 / 3407 / 9018) тарифното мито е обикновено 0%",
    supplier.vatIncludedInPrice
      ? "ДДС вече е в показаната цена (IOSS)"
      : `вносно ДДС ${Math.round(BG_IMPORT_VAT * 100)}% върху (стока + доставка + мито)`,
    `куриерска такса за оформяне €${COURIER_CLEARANCE_EUR.toFixed(2)} на пратка`,
  ];

  return {
    duty,
    vat,
    clearance,
    amount,
    note: parts.join(" · "),
  };
}

export function quoteShipment(input: {
  supplier: Supplier;
  goodsEur: number;
  itemCount?: number;
}) {
  const itemCount = input.itemCount ?? 1;
  const supplier = input.supplier;
  const goodsNet = input.goodsEur;
  const netListed = Boolean(supplier.listedPriceIsNet);
  const vatRate = netListed ? (supplier.sourceVatRate ?? 0.19) : 0;
  const surcharge =
    netListed &&
    supplier.minOrderNet != null &&
    goodsNet < supplier.minOrderNet
      ? supplier.minOrderFeeNet ?? 0
      : 0;

  const shipping = netListed && supplier.shippingNet != null
    ? supplier.freeShippingFromNet != null &&
      goodsNet >= supplier.freeShippingFromNet
      ? 0
      : supplier.shippingNet
    : shippingForShipment(supplier.region, goodsNet);

  const shopVat = netListed
    ? round2((goodsNet + surcharge + shipping) * vatRate)
    : 0;

  const customs = customsForShipment(
    supplier,
    goodsNet,
    shipping,
    itemCount
  );

  const extras = round2(surcharge + shopVat);
  const note = netListed
    ? [
        `цената на сайта е без ДДС`,
        `на касата +${Math.round(vatRate * 100)}% ДДС`,
        surcharge > 0
          ? `надбавка ${surcharge.toFixed(2)} € под ${supplier.minOrderNet} € нето`
          : null,
        `доставка ${shipping.toFixed(2)} € нето`,
        `без ДДС регистрация плащате този 19%; с BG ДДС номер често е reverse charge`,
      ]
        .filter(Boolean)
        .join(" · ")
    : customs.note;

  return {
    shipping,
    surcharge: round2(surcharge),
    shopVat,
    duty: customs.duty,
    vat: round2(customs.vat + shopVat),
    clearance: round2(customs.clearance + surcharge),
    amount: round2(customs.amount + extras),
    note,
    total: round2(goodsNet + shipping + extras + customs.amount),
  };
}

export function findCatalogMatches(query: string): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = CATALOG.map((product) => {
    const haystack = [
      product.name,
      product.brand,
      product.category,
      product.searchQuery,
      ...product.aliases,
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    if (product.name.toLowerCase() === q) score += 100;
    if (product.name.toLowerCase().includes(q)) score += 40;
    if (product.brand.toLowerCase().includes(q)) score += 25;
    if (product.aliases.some((a) => a.includes(q) || q.includes(a))) score += 35;
    q.split(/\s+/).forEach((token) => {
      if (token.length > 2 && haystack.includes(token)) score += 10;
    });
    return { product, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((x) => x.product);
}

export function resolveProduct(query: string): CatalogProduct {
  const matches = findCatalogMatches(query);
  if (matches[0]) return matches[0];

  const name = query.trim();
  return {
    slug: slugFromQuery(query),
    name,
    brand: "Общо търсене",
    category: "Различно",
    unit: "1 бр.",
    description:
      "Свободно търсене — отваряме реалните продуктови страници с това име.",
    aliases: [],
    searchQuery: name,
  };
}

function slugFromQuery(query: string): string {
  return (
    query
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "product"
  );
}

export const PRICE_DISCLAIMER =
  "Цената и линкът идват на живо от магазина — само ако заглавието съвпада с търсенето. Всички суми са в евро. Доставката и митницата са калкулация към България.";
