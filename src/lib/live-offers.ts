import {
  SUPPLIERS,
  quoteShipment,
  round2,
  type ProductOffer,
  type Supplier,
  type SupplierRegion,
  type UncheckedShop,
} from "@/lib/products";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type LiveHit = {
  supplier: Supplier;
  title: string;
  url: string;
  priceEur: number;
  inStock: boolean;
};

export type LiveOfferResult = {
  offers: ProductOffer[];
  uncheckedShops: UncheckedShop[];
};

const cache = new Map<string, { expiresAt: number; value: LiveOfferResult }>();
const CACHE_MS = 10 * 60 * 1000;
const sitemapCache = new Map<string, { expiresAt: number; urls: string[] }>();
const SITEMAP_MS = 30 * 60 * 1000;
const MARKETPLACE_IDS = new Set(["amazonde", "temu"]);
const LEGACY_BGN_PER_EUR = 1.95583;

const WEAK_TOKENS = /^(a[1-4]|b[1-4]|c[1-4]|d[1-4]|xt|ml|kit|the|and|for)$/i;
const TOKEN_SYNONYMS: Record<string, string[]> = {
  z350: ["z350", "ultimate", "supreme"],
  ultimate: ["ultimate", "z350", "supreme"],
  supreme: ["supreme", "z350", "ultimate"],
  septanest: ["septanest", "септанест"],
  септанест: ["септанест", "septanest"],
};

function tokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1);
}

function normalizeHay(value: string): string {
  return value
    .toLowerCase()
    .replace(/(\d)[.\s\u00a0](?=\d)/g, "$1");
}

function isWeakToken(token: string): boolean {
  return WEAK_TOKENS.test(token) || (/^\d+$/.test(token) && token.length >= 4);
}

function shopQuery(query: string): string {
  const parts = tokens(query).filter(
    (token) => !isWeakToken(token) && !TOKEN_SYNONYMS[token]
  );
  if (parts.length) return parts.slice(0, 3).join(" ");
  const fallback = tokens(query).filter((token) => !isWeakToken(token));
  return (fallback.slice(0, 3).join(" ") || query).trim();
}

const CYRILLIC_SHOP_ALIASES: Record<string, string> = {
  septanest: "Септанест",
  scandonest: "Скандонест",
  filtek: "Филтек",
};

function shopQueries(query: string): string[] {
  const primary = shopQuery(query);
  const extras = tokens(query)
    .map((token) => CYRILLIC_SHOP_ALIASES[token])
    .filter((value): value is string => Boolean(value));
  return [...new Set([primary, ...extras].map((value) => value.trim()).filter(Boolean))];
}

function tokenHits(hay: string, part: string): boolean {
  if (part.length <= 2) {
    return new RegExp(`(?:^|[^\\p{L}\\p{N}])${part}(?:[^\\p{L}\\p{N}]|$)`, "iu").test(
      hay
    );
  }
  if (hay.includes(part)) return true;
  return (TOKEN_SYNONYMS[part] ?? []).some((alt) => hay.includes(alt));
}

function adrenalineRatio(value: string): "100000" | "200000" | null {
  const hay = normalizeHay(value);
  if (
    /1[:/]100000|1\/100\s*000|1:100[\s.]000|10\s*(µg|ug|микрограм)/i.test(hay)
  ) {
    return "100000";
  }
  if (
    /1[:/]200000|1\/200\s*000|1:200[\s.]000|5\s*(µg|ug|микрограм)/i.test(hay)
  ) {
    return "200000";
  }
  return null;
}

function looksLikeAnestheticPack(title: string): boolean {
  return /карпул|cartucho|cartridge|zylinder|ampulle|packung|кутия|50\s*x/i.test(
    title
  );
}

function looksWrongVariant(title: string, query: string): boolean {
  const t = title.toLowerCase();
  const q = query.toLowerCase();
  if (/\bflow\b|флоу/.test(t) && !/\bflow\b|флоу/.test(q)) return true;
  if (/\bmini body\b/.test(t) && !/\bmini body\b/.test(q)) return true;
  const anestheticQuery = /septanest|септанест|scandonest|арти\s*каин|артикаин|анестез/.test(
    q
  );
  if (anestheticQuery) {
    if (
      /спринцовка|syringe|spritze|lancet|koine/.test(t) &&
      !looksLikeAnestheticPack(t)
    ) {
      return true;
    }
    if (/за карпул|for carp|für carp/.test(t)) return true;
  }
  if (/optibond/i.test(q) && /\bfl\b/i.test(q)) {
    if (/solo|universal|extra|ецващ|etchant/i.test(t) && !/\bfl\b/i.test(t)) {
      return true;
    }
  }
  return false;
}

function isStrongToken(token: string): boolean {
  if (TOKEN_SYNONYMS[token]) return true;
  if (isWeakToken(token)) return false;
  if (token.length >= 4) return true;
  return token.length === 2 && !/^[abcd][1-4]$/i.test(token);
}

function titleMatches(title: string, query: string): boolean {
  if (looksWrongVariant(title, query)) return false;
  const hay = normalizeHay(title);
  const parts = tokens(query).filter((part) => part.length >= 2 && !isWeakToken(part));
  if (!parts.length) {
    return tokens(query).some((part) => hay.includes(part));
  }
  const required = parts.filter(isStrongToken);
  const need = required.length ? required : parts;
  if (!need.every((part) => tokenHits(hay, part))) return false;
  const shade = query.toLowerCase().match(/\b([abcd][1-4])\b/);
  if (shade && /\b[abcd][1-4]\b/.test(hay) && !hay.includes(shade[1])) {
    return false;
  }
  return true;
}

function titleScore(title: string, query: string): number {
  const hay = normalizeHay(title);
  const parts = tokens(query);
  if (!parts.length) return 0;
  let hits = 0;
  for (const part of parts) {
    if (tokenHits(hay, part)) hits += part.length >= 4 ? 2 : 1;
  }
  const shade = query.toLowerCase().match(/\b([abcd][1-4])\b/);
  if (shade && hay.includes(shade[1])) hits += 1;
  const max = parts.reduce((sum, part) => sum + (part.length >= 4 ? 2 : 1), 0) + (shade ? 1 : 0);
  return hits / max;
}

function dentistBoost(title: string, query: string): number {
  const userRatio = adrenalineRatio(query);
  const titleRatio = adrenalineRatio(title);
  if (userRatio) return titleRatio === userRatio ? 3 : titleRatio ? 0.35 : 1;
  if (/septanest|септанест|scandonest|articain|артикаин/i.test(`${query} ${title}`)) {
    if (titleRatio === "100000") return 2;
    if (titleRatio === "200000") return 1;
  }
  if (/optibond/i.test(query) && /\bfl\b/i.test(query)) {
    if (/kit|комплект|праймер и адхезив|primer.+adhes/i.test(title)) return 2.2;
    if (/\bfl\b/i.test(title)) return 1.2;
  }
  return 0;
}

function dedupeHits(hits: LiveHit[]): LiveHit[] {
  const unique = new Map<string, LiveHit>();
  for (const hit of hits) {
    const key = hit.url.replace(/\/+$/, "").toLowerCase();
    const prev = unique.get(key);
    if (!prev || hit.priceEur < prev.priceEur) unique.set(key, hit);
  }
  return [...unique.values()];
}

function isSearchUrl(url: string): boolean {
  return (
    /[?&](s|q|k|search|SearchText|searchText|query)=/i.test(url) ||
    /\/(search|wholesale|catalogsearch|trade\/search)(\/|\?|$)/i.test(url)
  );
}

function hostOf(supplier: Supplier): string {
  return new URL(supplier.url).hostname.replace(/^www\./, "");
}

function sameHost(url: string, host: string): boolean {
  try {
    const parsed = new URL(url);
    const name = parsed.hostname.replace(/^www\./, "");
    return name === host || name.endsWith(`.${host}`) || host.endsWith(`.${name}`);
  } catch {
    return false;
  }
}

function isProductishUrl(url: string, host: string): boolean {
  try {
    const parsed = new URL(url);
    if (!sameHost(url, host)) return false;
    if (isSearchUrl(url)) return false;
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    if (path === "/" || /^\/(en|es|bg|de|fr|it)$/i.test(path)) return false;
    if (/\/(category|categories|collections?|brand|manufacturers?)(\/|$)/i.test(path)) {
      return false;
    }
    if (
      /\/(product|products|item|itm|offer|dp|gp\/product|p)(\/|$)/i.test(path) ||
      /\/product-detail\//i.test(path) ||
      /\/g-\d+/i.test(path) ||
      /\.html$/i.test(path)
    ) {
      return true;
    }
    const parts = path.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? "";
    if (parts.some((part) => part.length >= 10 && part.includes("-"))) return true;
    if (parts.length >= 2 && last.length >= 8) return true;
    return parts.length === 1 && last.length >= 10 && last.includes("-");
  } catch {
    return false;
  }
}

function toEurAmount(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  if (code === "EUR") return round2(amount);
  if (code === "BGN") return round2(amount / LEGACY_BGN_PER_EUR);
  if (code === "USD") return round2(amount * 0.92);
  if (code === "GBP") return round2(amount * 1.17);
  return round2(amount);
}

function availabilityFromValue(value: unknown): boolean | null {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (typeof value === "number") return value > 0 ? true : value === 0 ? false : null;
  if (typeof value !== "string") return null;
  const hay = value.toLowerCase().replace(/https?:\/\/schema\.org\//g, "");
  if (
    /outofstock|out[\s_-]?of[\s_-]?stock|sold[\s_-]?out|discontinued|unavailable|notavailable|nicht[\s_-]?lieferbar|nicht[\s_-]?verf(?:ü|u)gbar|ausverkauft|изчерпан|няма[\s_-]?наличност|agotado|sin[\s_-]?stock/.test(
      hay
    )
  ) {
    return false;
  }
  if (
    /instock|in[\s_-]?stock|limitedavailability|preorder|pre[\s_-]?order|backorder|lieferbar|available|налич/.test(
      hay
    )
  ) {
    return true;
  }
  return null;
}

function parseHtmlAvailability(html: string): boolean | null {
  const patterns = [
    /itemprop=["']availability["'][^>]*(?:href|content)=["']([^"']+)/i,
    /(?:href|content)=["']([^"']+)["'][^>]*itemprop=["']availability["']/i,
    /property=["']og:availability["'][^>]+content=["']([^"']+)/i,
    /"availability"\s*:\s*"([^"]+)"/i,
    /"stock_status"\s*:\s*"([^"]+)"/i,
    /"is_in_stock"\s*:\s*(true|false)/i,
    /"available"\s*:\s*(true|false)/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;
    const parsed = availabilityFromValue(match[1]);
    if (parsed !== null) return parsed;
  }
  const bodyClass = html.match(/<body[^>]*class=["']([^"']+)/i)?.[1] ?? "";
  if (/\b(?:outofstock|out-of-stock|sold-out|unavailable)\b/i.test(bodyClass)) {
    return false;
  }
  return null;
}

function stockFromNearbyText(html: string): boolean | null {
  const structured = parseHtmlAvailability(html);
  if (structured !== null) return structured;
  if (
    /изчерпан|няма наличност|не е наличен|nicht lieferbar|nicht verfügbar|ausverkauft|agotado|sold out|out of stock|currently unavailable/i.test(
      html
    )
  ) {
    return false;
  }
  return null;
}

function stockNearUrl(html: string, url: string): boolean | null {
  const needles = [url];
  try {
    const parsed = new URL(url);
    needles.push(parsed.pathname, parsed.pathname.replace(/^\//, ""));
  } catch {
    /* ignore */
  }
  for (const needle of needles) {
    const idx = html.indexOf(needle);
    if (idx < 0) continue;
    const parsed = stockFromNearbyText(
      html.slice(Math.max(0, idx - 240), idx + 900)
    );
    if (parsed !== null) return parsed;
  }
  return null;
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(/[^\d,.]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") && !cleaned.includes(".")
    ? cleaned.replace(",", ".")
    : cleaned.replace(/,/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

const fetchWaiters: Array<() => void> = [];
let fetchActive = 0;
const FETCH_LIMIT = 8;

async function withFetchSlot<T>(work: () => Promise<T>): Promise<T> {
  if (fetchActive >= FETCH_LIMIT) {
    await new Promise<void>((resolve) => fetchWaiters.push(resolve));
  }
  fetchActive += 1;
  try {
    return await work();
  } finally {
    fetchActive -= 1;
    fetchWaiters.shift()?.();
  }
}

async function fetchText(
  url: string,
  timeoutMs = 5000,
  accept = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"
): Promise<string | null> {
  return withFetchSlot(async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: "follow",
        cache: "no-store",
        headers: {
          "user-agent": UA,
          accept,
          "accept-language": "bg,en;q=0.8,es;q=0.6",
        },
      });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  });
}

function unwrapSearchHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return text;
  try {
    const data = JSON.parse(trimmed) as unknown;
    const chunks: string[] = [];
    const walk = (value: unknown) => {
      if (typeof value === "string") {
        if (value.includes("<") || /https?:|optibond|product/i.test(value)) {
          chunks.push(value);
        }
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(walk);
        return;
      }
      if (value && typeof value === "object") {
        for (const item of Object.values(value)) walk(item);
      }
    };
    walk(data);
    return chunks.join("\n") || text;
  } catch {
    return text;
  }
}

async function searchWoo(
  supplier: Supplier,
  query: string,
  matchQuery = query
): Promise<LiveHit[]> {
  const origin = new URL(supplier.url).origin;
  const url = `${origin}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=16`;
  const text = await fetchText(url, 4000, "application/json");
  if (!text || !text.trim().startsWith("[")) return [];
  let items: Array<{
    name?: string;
    permalink?: string;
    is_in_stock?: boolean;
    is_purchasable?: boolean;
    prices?: {
      price?: string;
      sale_price?: string;
      currency_code?: string;
      currency_minor_unit?: number;
    };
  }>;
  try {
    items = JSON.parse(text);
  } catch {
    return [];
  }
  const ranked = items
    .map((item) => ({
      item,
      score: titleScore(item.name ?? "", matchQuery),
    }))
    .filter(
      (row) =>
        row.score >= 0.28 &&
        titleMatches(row.item.name ?? "", matchQuery) &&
        row.item.permalink &&
        !isSearchUrl(row.item.permalink)
    )
    .sort(
      (a, b) =>
        dentistBoost(b.item.name ?? "", matchQuery) +
        b.score -
        (dentistBoost(a.item.name ?? "", matchQuery) + a.score)
    );

  const hits: LiveHit[] = [];
  for (const row of ranked.slice(0, 8)) {
    const minor = row.item.prices?.currency_minor_unit ?? 2;
    const raw = Number(row.item.prices?.sale_price || row.item.prices?.price || 0);
    if (!raw || !row.item.permalink) continue;
    hits.push({
      supplier,
      title: row.item.name ?? query,
      url: row.item.permalink,
      priceEur: toEurAmount(raw / 10 ** minor, row.item.prices?.currency_code ?? "EUR"),
      inStock: row.item.is_in_stock !== false,
    });
    if (hits.length >= 4) break;
  }
  return hits;
}

async function searchShopifyCatalog(
  supplier: Supplier,
  query: string
): Promise<LiveHit | null> {
  const origin = new URL(supplier.url).origin;
  for (let page = 1; page <= 4; page++) {
    const text = await fetchText(
      `${origin}/products.json?limit=250&page=${page}`,
      8000
    );
    if (!text || !text.trim().startsWith("{")) return null;
    try {
      const data = JSON.parse(text) as {
        products?: Array<{
          title?: string;
          handle?: string;
          variants?: Array<{ price?: string; available?: boolean }>;
        }>;
      };
      const products = data.products ?? [];
      if (!products.length) return null;
      const ranked = products
        .map((item) => ({
          item,
          score: titleScore(item.title ?? "", query),
        }))
        .filter(
          (row) =>
            row.score >= 0.5 &&
            titleMatches(row.item.title ?? "", query) &&
            row.item.handle
        )
        .sort((a, b) => b.score - a.score);
      const best = ranked[0]?.item;
      if (best?.handle) {
        const amount = Number(best.variants?.[0]?.price ?? 0);
        if (!amount) return null;
        return {
          supplier,
          title: best.title ?? query,
          url: `${origin}/products/${best.handle}`,
          priceEur: toEurAmount(amount, "EUR"),
          inStock: best.variants?.some((variant) => variant.available !== false) ?? true,
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}

async function searchShopify(supplier: Supplier, query: string): Promise<LiveHit | null> {
  const origin = new URL(supplier.url).origin;
  const url = `${origin}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=8`;
  const text = await fetchText(url, 7000);
  if (!text || !text.trim().startsWith("{")) return null;
  try {
    const data = JSON.parse(text) as {
      resources?: {
        results?: {
          products?: Array<{
            title?: string;
            url?: string;
            price?: string | number;
            available?: boolean;
          }>;
        };
      };
    };
    const products = data.resources?.results?.products ?? [];
    const ranked = products
      .map((item) => ({ item, score: titleScore(item.title ?? "", query) }))
      .filter(
        (row) =>
          row.score >= 0.45 &&
          titleMatches(row.item.title ?? "", query) &&
          row.item.url
      )
      .sort((a, b) => b.score - a.score);
    const best = ranked[0]?.item;
    if (!best?.url) return null;
    const productUrl = new URL(best.url, origin).href;
    if (isSearchUrl(productUrl)) return null;
    const amount = Number(String(best.price ?? "").replace(",", "."));
    if (!amount) return null;
    return {
      supplier,
      title: best.title ?? query,
      url: productUrl,
      priceEur: toEurAmount(amount, "EUR"),
      inStock: best.available !== false,
    };
  } catch {
    return null;
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&euro;/g, "€")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function titleFromHref(href: string): string {
  try {
    const last = decodeURIComponent(
      new URL(href).pathname.split("/").filter(Boolean).pop() ?? ""
    );
    return last.replace(/\.html?$/i, "").replace(/[-_]+/g, " ");
  } catch {
    return "";
  }
}

function extractLinks(html: string, base: string): Array<{ href: string; title: string }> {
  const found: Array<{ href: string; title: string }> = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    let href: string;
    try {
      href = new URL(decodeHtml(match[1]), base).href.split("#")[0];
    } catch {
      continue;
    }
    const title = decodeHtml(match[2].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    const fallback = titleFromHref(href);
    if (title.length > 3 || fallback.length > 3) {
      found.push({ href, title: title.length > 3 ? title : fallback });
    }
  }
  return found;
}

function extractHrefCandidates(
  html: string,
  base: string
): Array<{ href: string; title: string }> {
  const found = new Map<string, { href: string; title: string }>();
  for (const link of extractLinks(html, base)) {
    found.set(link.href, link);
  }
  const re = /(?:href|data-url|data-href)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    let href: string;
    try {
      href = new URL(decodeHtml(match[1]), base).href.split("#")[0];
    } catch {
      continue;
    }
    const title = titleFromHref(href);
    const prev = found.get(href);
    if (!prev) found.set(href, { href, title });
    else if (title.length > prev.title.length) found.set(href, { href, title });
  }
  return [...found.values()];
}

function titleNearHref(html: string, url: string): string {
  const needles = [url];
  try {
    needles.push(new URL(url).pathname);
  } catch {
    /* ignore */
  }
  for (const needle of needles) {
    const idx = html.indexOf(needle);
    if (idx < 0) continue;
    const text = html
      .slice(Math.max(0, idx - 280), idx + 420)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 8) return text.slice(0, 180);
  }
  return "";
}

function priceNearUrl(html: string, url: string): number | null {
  const needles = [url];
  try {
    const parsed = new URL(url);
    needles.push(parsed.pathname, parsed.pathname.replace(/^\//, ""));
  } catch {
    /* ignore */
  }
  for (const needle of needles) {
    const idx = html.indexOf(needle);
    if (idx < 0) continue;
    const window = html.slice(Math.max(0, idx - 240), idx + 900);
    const visible = parseVisiblePrice(window);
    if (visible?.price) return visible.price;
  }
  return null;
}

function decodeBingHref(href: string): string {
  try {
    const parsed = new URL(href);
    if (!parsed.hostname.includes("bing.com")) return href;
    const u = parsed.searchParams.get("u");
    if (!u) return href;
    const raw = u.replace(/^a1/, "");
    const padded = raw + "=".repeat((4 - (raw.length % 4 || 4)) % 4);
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    return decoded.startsWith("http") ? decoded : href;
  } catch {
    return href;
  }
}

function parseJsonLdProduct(
  html: string
): { title?: string; price?: number; currency?: string; inStock: boolean | null } | null {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  for (const block of blocks) {
    try {
      const json = JSON.parse(block[1].replace(/[\u0000-\u001f]/g, " "));
      const nodes = Array.isArray(json)
        ? json
        : json["@graph"]
          ? json["@graph"]
          : [json];
      for (const node of nodes) {
        if (!node) continue;
        const type = Array.isArray(node["@type"]) ? node["@type"].join(" ") : node["@type"];
        if (!String(type ?? "").toLowerCase().includes("product")) continue;
        const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
        const price = Number(offer?.price ?? offer?.lowPrice ?? node.offers?.price);
        if (!price) continue;
        return {
          title: node.name,
          price,
          currency: offer?.priceCurrency ?? "EUR",
          inStock: availabilityFromValue(offer?.availability),
        };
      }
    } catch {
      /* ignore one block */
    }
  }
  return null;
}

function parseMetaPrice(
  html: string
): { title?: string; price?: number; currency?: string } | null {
  const title =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ||
    html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const amountRaw =
    html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)/i)?.[1] ||
    html.match(/<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)/i)?.[1] ||
    html.match(/itemprop=["']price["'][^>]+content=["']([^"']+)/i)?.[1] ||
    html.match(/content=["']([^"']+)["'][^>]+itemprop=["']price["']/i)?.[1];
  const currency =
    html.match(/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)/i)?.[1] ||
    html.match(/itemprop=["']priceCurrency["'][^>]+content=["']([^"']+)/i)?.[1];
  const price = amountRaw ? parseMoney(amountRaw) : null;
  if (!price) return title ? { title: title.replace(/\s+/g, " ").trim() } : null;
  return {
    title: title?.replace(/\s+/g, " ").trim(),
    price,
    currency: currency || "EUR",
  };
}

function parseVisiblePrice(html: string): { price: number; currency: string } | null {
  const euro = html.match(/(?:€|&euro;)\s*([0-9]{1,4}(?:[.,][0-9]{2}))/);
  const euroAfter = html.match(/([0-9]{1,4}(?:[.,][0-9]{2}))\s*(?:€|&euro;|EUR)/i);
  const lev = html.match(/([0-9]{1,5}(?:[.,][0-9]{2}))\s*(?:лв\.?|BGN)/i);
  if (euro?.[1] || euroAfter?.[1]) {
    const price = parseMoney(euro?.[1] || euroAfter?.[1] || "");
    if (price && price >= 3 && price < 5000) return { price, currency: "EUR" };
  }
  if (lev?.[1]) {
    const price = parseMoney(lev[1]);
    if (price && price >= 5 && price < 10000) {
      return { price: toEurAmount(price, "BGN"), currency: "EUR" };
    }
  }
  return null;
}

async function hydrateFromProductPage(
  supplier: Supplier,
  url: string,
  fallbackTitle: string,
  query: string
): Promise<LiveHit | null> {
  if (isSearchUrl(url) || !isProductishUrl(url, hostOf(supplier))) return null;
  const html = await fetchText(url, 5000);
  if (!html) return null;
  const jsonLd = parseJsonLdProduct(html);
  const meta = parseMetaPrice(html);
  const visible = jsonLd?.price || meta?.price ? null : parseVisiblePrice(html);
  const title = decodeHtml(jsonLd?.title || meta?.title || fallbackTitle);
  if (looksWrongVariant(title, query)) return null;
  if (!titleMatches(title, query)) return null;
  const price = jsonLd?.price || meta?.price || visible?.price;
  if (!price) return null;
  const currency = jsonLd?.currency || meta?.currency || visible?.currency || "EUR";
  return {
    supplier,
    title,
    url,
    priceEur: toEurAmount(price, currency),
    inStock:
      jsonLd?.inStock ??
      parseHtmlAvailability(html) ??
      stockAroundBuyButton(html) ??
      true,
  };
}

function shopSearchCandidates(supplier: Supplier, query: string): string[] {
  const origin = new URL(supplier.url).origin;
  const q = encodeURIComponent(query);
  const extras = [
    supplier.searchUrl(query),
    `${origin}/suggest?search=${q}`,
    `${origin}/?s=${q}&post_type=product`,
    `${origin}/?s=${q}`,
    `${origin}/search?q=${q}`,
    `${origin}/search?sSearch=${q}`,
    `${origin}/en/search?q=${q}`,
    `${origin}/es/search?q=${q}`,
    `${origin}/catalogsearch/result/?q=${q}`,
    `${origin}/cautare?s=${q}`,
    `${origin}/search?controller=search&s=${q}`,
    `${origin}/index.php?route=product/search&search=${q}`,
  ];
  return [...new Set(extras)];
}

async function searchHtml(
  supplier: Supplier,
  query: string,
  matchQuery = query
): Promise<LiveHit[]> {
  const host = hostOf(supplier);
  const hits: LiveHit[] = [];
  const seen = new Set<string>();
  for (const searchUrl of shopSearchCandidates(supplier, query).slice(0, 2)) {
    const raw = await fetchText(searchUrl, 4000);
    if (!raw) continue;
    const html = unwrapSearchHtml(raw);
    const links = extractHrefCandidates(html, supplier.url)
      .map((link) => {
        const slug = titleFromHref(link.href);
        const nearby = titleNearHref(html, link.href);
        const title = decodeHtml(link.title || nearby || slug);
        return {
          ...link,
          title,
          score: Math.max(
            titleScore(title, matchQuery),
            titleScore(slug, matchQuery),
            titleScore(nearby, matchQuery)
          ),
        };
      })
      .filter(
        (link) =>
          isProductishUrl(link.href, host) &&
          !isSearchUrl(link.href) &&
          !looksWrongVariant(link.title, matchQuery) &&
          !looksWrongVariant(titleFromHref(link.href), matchQuery) &&
          (link.score >= 0.28 || titleMatches(titleFromHref(link.href), matchQuery))
      )
      .sort((a, b) => {
        const boost = (title: string) => dentistBoost(title, matchQuery);
        return boost(b.title) + b.score - (boost(a.title) + a.score);
      });
    for (const link of links.slice(0, 4)) {
      const key = link.href.replace(/\/+$/, "").toLowerCase();
      if (seen.has(key)) continue;
      const listed = priceNearUrl(html, link.href);
      const listedStock = stockNearUrl(html, link.href);
      if (
        listed &&
        listedStock !== null &&
        (titleMatches(link.title, matchQuery) ||
          titleMatches(titleFromHref(link.href), matchQuery))
      ) {
        seen.add(key);
        hits.push({
          supplier,
          title: link.title,
          url: link.href,
          priceEur: listed,
          inStock: listedStock,
        });
        if (hits.length >= 2) return hits;
        continue;
      }
      const hit = await hydrateFromProductPage(
        supplier,
        link.href,
        link.title,
        matchQuery
      );
      if (!hit) continue;
      seen.add(hit.url.replace(/\/+$/, "").toLowerCase());
      hits.push(hit);
      if (hits.length >= 2) return hits;
    }
    if (hits.length >= 1) return hits;
  }
  return hits;
}

function sitemapPriority(url: string): number {
  let score = 0;
  if (/product/i.test(url)) score += 6;
  if (/en-|en_|\/en/i.test(url)) score += 4;
  if (/es-|es_|\/es/i.test(url)) score += 3;
  if (/bg-|bg_/i.test(url)) score += 3;
  if (/image|video|page|post|category|tag/i.test(url)) score -= 5;
  return score;
}

async function collectSitemapUrls(supplier: Supplier): Promise<string[]> {
  const host = hostOf(supplier);
  const cached = sitemapCache.get(host);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.urls;

  const origin = new URL(supplier.url).origin;
  const seeds = [
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap.xml`,
    `${origin}/wp-sitemap.xml`,
  ];
  const robots = await fetchText(`${origin}/robots.txt`, 5000);
  if (robots) {
    for (const match of robots.matchAll(/^sitemap:\s*(\S+)/gim)) {
      seeds.push(match[1]);
    }
  }

  const childMaps = new Set<string>();
  const directUrls: string[] = [];

  for (const seed of [...new Set(seeds)]) {
    const xml = await fetchText(seed, 7000);
    if (!xml || !xml.includes("<")) continue;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
    for (const loc of locs) {
      if (/\.xml(\.gz)?$/i.test(loc) || /sitemap/i.test(loc)) childMaps.add(loc);
      else if (sameHost(loc, host)) directUrls.push(loc);
    }
  }

  const rankedMaps = [...childMaps]
    .sort((a, b) => sitemapPriority(b) - sitemapPriority(a))
    .slice(0, 10);

  const batches: string[][] = [];
  for (let i = 0; i < rankedMaps.length; i += 6) {
    batches.push(rankedMaps.slice(i, i + 6));
  }
  for (const batch of batches) {
    const pages = await Promise.all(batch.map((url) => fetchText(url, 8000)));
    for (const page of pages) {
      if (!page) continue;
      for (const match of page.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
        const loc = match[1].trim();
        if (sameHost(loc, host) && !/\.xml(\.gz)?$/i.test(loc)) directUrls.push(loc);
      }
    }
  }

  const urls = [...new Set(directUrls)];
  sitemapCache.set(host, { expiresAt: now + SITEMAP_MS, urls });
  return urls;
}

async function searchSitemap(supplier: Supplier, query: string): Promise<LiveHit | null> {
  if (MARKETPLACE_IDS.has(supplier.id)) return null;
  const host = hostOf(supplier);
  const urls = await collectSitemapUrls(supplier);
  if (!urls.length) return null;
  const ranked = urls
    .map((url) => ({
      url,
      score: titleScore(decodeURIComponent(url.replace(/\+/g, " ")), query),
    }))
    .filter((row) => row.score >= 0.5 && isProductishUrl(row.url, host) && !isSearchUrl(row.url))
    .sort((a, b) => b.score - a.score);

  for (const row of ranked.slice(0, 4)) {
    const hit = await hydrateFromProductPage(supplier, row.url, row.url, query);
    if (hit) return hit;
  }
  return null;
}

async function searchWebIndex(supplier: Supplier, query: string): Promise<LiveHit | null> {
  const host = hostOf(supplier);
  const q = `site:${host} ${query}`;
  const engines = [
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}`,
    `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  ];

  for (const engine of engines) {
    const html = await fetchText(engine, 8000);
    if (!html) continue;
    if (/anomaly-modal|captcha/i.test(html) && html.length < 4000) continue;
    const rawLinks = extractLinks(html, engine).map((link) => ({
      ...link,
      href: decodeBingHref(link.href),
    }));
    const ranked = rawLinks
      .map((link) => ({ ...link, score: titleScore(`${link.title} ${link.href}`, query) }))
      .filter(
        (link) =>
          isProductishUrl(link.href, host) &&
          !isSearchUrl(link.href) &&
          link.score >= 0.35
      )
      .sort((a, b) => b.score - a.score);

    for (const link of ranked.slice(0, 4)) {
      const hit = await hydrateFromProductPage(supplier, link.href, link.title, query);
      if (hit) return hit;
    }
  }
  return null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });
}

async function searchFast(supplier: Supplier, query: string): Promise<LiveHit[]> {
  const queries = shopQueries(query);
  const found = await withTimeout(
    (async () => {
      const collected: LiveHit[] = [];
      for (const q of queries) {
        collected.push(...(await searchWoo(supplier, q, query)));
        if (collected.length >= 2) break;
        collected.push(...(await searchHtml(supplier, q, query)));
        if (collected.length >= 1) break;
      }
      return dedupeHits(collected).slice(0, 3);
    })(),
    8000
  );
  return found ?? [];
}

async function searchSlow(supplier: Supplier, query: string): Promise<LiveHit | null> {
  return withTimeout(
    (async () => {
      const web = await searchWebIndex(supplier, query);
      if (web) return web;
      return searchSitemap(supplier, query);
    })(),
    10000
  );
}

function regionForHost(host: string): SupplierRegion {
  if (host.endsWith(".bg")) return "BG";
  if (
    /aliexpress|alibaba|made-in-china|dhgate|temu/i.test(host)
  ) {
    return "INTL";
  }
  return "EU";
}

function supplierFromUrl(url: string): Supplier | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const origin = `${parsed.protocol}//${parsed.hostname}`;
    const region = regionForHost(host);
    return {
      id: `web-${host}`,
      name: host,
      url: origin,
      region,
      publicShop: true,
      vatIncludedInPrice: region !== "INTL" || /aliexpress|temu/i.test(host),
      iossLikely: /aliexpress|temu/i.test(host),
      searchUrl: (query) => `${origin}/search?q=${encodeURIComponent(query)}`,
      note: "Намерен на живо през търсачка.",
    };
  } catch {
    return null;
  }
}

function looksUsefulShop(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (
      /google|bing|duckduckgo|brave\.com|facebook|youtube|wikipedia|linkedin|instagram|microsoft|apple\.com|tiktok/i.test(
        host
      )
    ) {
      return false;
    }
    if (
      SUPPLIERS.some((supplier) => {
        const known = hostOf(supplier);
        return host === known || host.endsWith(`.${known}`);
      })
    ) {
      return true;
    }
    return /dent|stoma|kerr|ivoclar|3m|gc\.|amazon|ebay|alibaba|aliexpress|temu|medic|patricia|henry|schein|safco|promo|oral|dhgate|medident/i.test(
      host
    );
  } catch {
    return false;
  }
}

function supplierForUrl(url: string): Supplier | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const known = SUPPLIERS.find((supplier) => {
      const name = hostOf(supplier);
      return host === name || host.endsWith(`.${name}`) || name.endsWith(`.${host}`);
    });
    return known ?? supplierFromUrl(url);
  } catch {
    return null;
  }
}

async function discoverExtra(
  query: string,
  knownHosts: Set<string>
): Promise<LiveHit[]> {
  const engines = [
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${query} dental`)}`,
    `https://www.bing.com/search?q=${encodeURIComponent(`${query} цена`)}`,
  ];

  const candidates: Array<{ href: string; title: string; score: number }> = [];
  for (const engine of engines) {
    const html = await fetchText(engine, 7000);
    if (!html) continue;
    if (/anomaly-modal|captcha/i.test(html) && html.length < 4000) continue;
    for (const link of extractHrefCandidates(html, engine)) {
      const href = decodeBingHref(link.href);
      if (isSearchUrl(href) || !looksUsefulShop(href)) continue;
      let host: string;
      try {
        host = new URL(href).hostname.replace(/^www\./, "");
      } catch {
        continue;
      }
      if (knownHosts.has(host)) continue;
      const score = titleScore(`${link.title} ${titleFromHref(href)}`, query);
      if (score < 0.35 && !titleMatches(titleFromHref(href), query)) continue;
      candidates.push({ href, title: decodeHtml(link.title), score });
    }
  }

  const ranked = candidates.sort((a, b) => b.score - a.score).slice(0, 16);
  const hits: LiveHit[] = [];
  const used = new Set<string>();

  for (const row of ranked) {
    const supplier = supplierForUrl(row.href);
    if (!supplier) continue;
    const host = hostOf(supplier);
    if (used.has(host) || knownHosts.has(host)) continue;
    if (!isProductishUrl(row.href, host)) continue;
    const hit = await hydrateFromProductPage(supplier, row.href, row.title, query);
    if (!hit) continue;
    used.add(host);
    hits.push(hit);
    if (hits.length >= 6) break;
  }
  return hits;
}

function toOffer(hit: LiveHit): ProductOffer {
  const quote = quoteShipment({
    supplier: hit.supplier,
    goodsEur: hit.priceEur,
    itemCount: 1,
  });
  return {
    supplierId: hit.supplier.id,
    supplierName: hit.supplier.name,
    supplierUrl: hit.supplier.url,
    region: hit.supplier.region,
    productName: hit.title,
    packLabel: hit.title,
    productUrl: hit.url,
    linkKind: "product",
    linkLabel: "Отвори продукта",
    inStock: hit.inStock,
    currency: "EUR",
    price: hit.priceEur,
    priceKind: "listed",
    shipping: quote.shipping,
    surcharge: quote.surcharge,
    shopVat: quote.shopVat,
    customs: quote.amount,
    duty: quote.duty,
    importVat: quote.vat,
    clearanceFee: quote.clearance,
    customsNote: quote.note,
    total: quote.total,
    deliveryDays:
      hit.supplier.region === "BG"
        ? "1–3 дни"
        : hit.supplier.region === "EU"
          ? "3–8 дни"
          : "12–28 дни",
  };
}

export async function fetchLiveOffers(query: string): Promise<LiveOfferResult> {
  const key = `eur-v10:${query.trim().toLowerCase()}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const started = Date.now();
  const hits: LiveHit[] = [];
  const foundIds = new Set<string>();

  const specialty = SUPPLIERS.filter(
    (supplier) => !MARKETPLACE_IDS.has(supplier.id)
  );
  const markets = SUPPLIERS.filter((supplier) =>
    MARKETPLACE_IDS.has(supplier.id)
  );

  async function take(shops: Supplier[]) {
    const rows = await Promise.allSettled(
      shops.map((supplier) => searchFast(supplier, query))
    );
    rows.forEach((result, index) => {
      if (result.status !== "fulfilled" || !result.value.length) return;
      hits.push(...result.value);
      foundIds.add(shops[index].id);
    });
  }

  await take(specialty.slice(0, 8));

  const shopCount = () => new Set(hits.map((hit) => hostOf(hit.supplier))).size;

  if (shopCount() < 6 && Date.now() - started < 12000) {
    await take(specialty.slice(8));
  }

  if (shopCount() < 4 && Date.now() - started < 16000) {
    await take(markets);
  }

  const unchecked: UncheckedShop[] = SUPPLIERS.filter(
    (supplier) => !foundIds.has(supplier.id)
  ).map((supplier) => ({
    supplierId: supplier.id,
    supplierName: supplier.name,
    url: supplier.url,
    reason:
      "Не намерихме продуктовия линк с това име. Не показваме цена и не пращаме към търсене.",
  }));

  const unique = dedupeHits(hits);

  const offers = unique
    .map(toOffer)
    .sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      const boost =
        dentistBoost(b.productName, query) + titleScore(b.productName, query) -
        (dentistBoost(a.productName, query) + titleScore(a.productName, query));
      if (Math.abs(boost) > 0.2) return boost;
      return a.total - b.total;
    })
    .slice(0, 16);
  const stocked = offers.filter((offer) => offer.inStock);
  const worst = (stocked.length ? stocked : offers).at(-1)?.total ?? 0;
  const ranked = offers.map((offer) => ({
    ...offer,
    savingsVsWorst: offer.inStock
      ? round2(Math.max(0, worst - offer.total))
      : 0,
  }));

  const value = { offers: ranked, uncheckedShops: unchecked };
  if (ranked.length > 0) {
    cache.set(key, { expiresAt: Date.now() + CACHE_MS, value });
  }
  return value;
}
