export type OfferKind = "main" | "kit" | "accessory" | "other";

const ACCESSORY_QUERY =
  /\b(tip|tips|mixing|nozzle|applicator|refill|накрайник|смесител|канюла)\b/i;

const ACCESSORY_TITLE =
  /\b(mixing[\s_-]?tip|tip[\s_-]?pack|tips[\s_-]?regular|applicator[\s_-]?tip|mixing[\s_-]?tips|nozzle|накрайник|смесител|канюла|only[\s_-]?tips|refill[\s_-]?only)\b|packung[\s\d]*mixing|tip[\s_-]?packung|\d+\s*mixing[\s_-]?tips/i;

const KIT_TITLE =
  /\b(kit|комплект|intro|assortment|handmix|сет|set\s+\d|starter)\b/i;

const MAIN_TITLE =
  /\b(cement|цимент|paste|паста|adhesive[\s_-]?system|bonding[\s_-]?system|universal[\s_-]?sa|panavia[\s_-]?sa)\b/i;

export function queryWantsAccessory(query: string): boolean {
  return ACCESSORY_QUERY.test(query);
}

export function classifyOfferKind(title: string, query: string): OfferKind {
  const t = title.toLowerCase();
  const isAccessory = ACCESSORY_TITLE.test(t);
  const isKit = KIT_TITLE.test(t);
  const isMain = MAIN_TITLE.test(t);

  if (queryWantsAccessory(query)) {
    if (isAccessory) return "accessory";
    if (isKit) return "kit";
    if (isMain) return "main";
    return "other";
  }

  if (isAccessory) {
    const tipLike = /\b(tip|tips|mixing|nozzle|applicator)\b/i.test(t);
    if (!isKit || tipLike) return "accessory";
  }
  if (isKit) return "kit";
  if (isMain) return "main";
  return "other";
}

export function offerKindRank(kind: OfferKind): number {
  if (kind === "main") return 0;
  if (kind === "kit") return 1;
  if (kind === "other") return 2;
  return 3;
}

export function canBeBestOffer(offerKind: OfferKind, query: string): boolean {
  if (offerKind === "accessory" && !queryWantsAccessory(query)) return false;
  return offerKind === "main" || offerKind === "kit" || offerKind === "other";
}

export function offerKindLabel(kind: OfferKind): string | null {
  if (kind === "main") return "Основен продукт";
  if (kind === "kit") return "Комплект";
  if (kind === "accessory") return "Консуматив или аксесоар";
  return null;
}
