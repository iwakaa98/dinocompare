import {
  remainingToFreeShipping,
  shopCheckoutInfo,
  SUPPLIERS,
  quoteShipment,
  round2,
  type ProductOffer,
  type Supplier,
  type SupplierRegion,
} from "@/lib/products";

export type ComboItem = {
  slug: string;
  name: string;
  unit: string;
  packLabel: string;
  supplierId: string;
  supplierName: string;
  region: SupplierRegion;
  price: number;
  shipping: number;
  customs: number;
  total: number;
  productUrl: string;
  qty: number;
};

export type ComboQuote = {
  supplierId: string;
  supplierName: string;
  region: SupplierRegion;
  itemCount: number;
  goods: number;
  separateShipping: number;
  separateCustoms: number;
  separateTotal: number;
  combinedShipping: number;
  combinedCustoms: number;
  combinedTotal: number;
  saved: number;
  reasons: string[];
  freeShippingFrom: number | null;
  remainingToFree: number | null;
  freeShippingIsNet: boolean;
  issuesEuInvoice: boolean;
};

export function supplierById(id: string): Supplier | undefined {
  return SUPPLIERS.find((s) => s.id === id);
}

export function comboItemFromOffer(
  product: { slug: string; name: string; unit: string },
  offer: ProductOffer
): ComboItem {
  return {
    slug: product.slug,
    name: product.name,
    unit: offer.packLabel || product.unit,
    packLabel: offer.packLabel || product.unit,
    supplierId: offer.supplierId,
    supplierName: offer.supplierName,
    region: offer.region,
    price: offer.price,
    shipping: offer.shipping,
    customs: offer.customs,
    total: offer.total,
    productUrl: offer.productUrl,
    qty: 1,
  };
}

const STORAGE_KEY = "dentsravni-combo-eur";

export function readComboItems(): ComboItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ComboItem[];
    return Array.isArray(parsed)
      ? parsed.map((item) => ({ ...item, qty: item.qty || 1 }))
      : [];
  } catch {
    return [];
  }
}

export function writeComboItems(items: ComboItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("dentsravni-combo"));
}

export function addComboItem(
  item: ComboItem,
  options?: { replaceShop?: boolean }
): { items: ComboItem[]; switched: boolean; sameShop: boolean } {
  const current = readComboItems();
  const otherShop = current.find((row) => row.supplierId !== item.supplierId);
  if (otherShop && !options?.replaceShop) {
    return { items: current, switched: false, sameShop: false };
  }

  const base = otherShop && options?.replaceShop ? [] : current;
  const exists = base.find(
    (row) =>
      row.slug === item.slug &&
      row.supplierId === item.supplierId &&
      row.packLabel === item.packLabel
  );
  const next = exists
    ? base.map((row) =>
        row === exists ? { ...row, qty: row.qty + 1 } : row
      )
    : [...base, { ...item, qty: item.qty || 1 }];
  writeComboItems(next);
  return {
    items: next,
    switched: Boolean(otherShop && options?.replaceShop),
    sameShop: true,
  };
}

export function setComboQty(item: ComboItem, qty: number) {
  const next = readComboItems()
    .map((row) =>
      row.slug === item.slug &&
      row.supplierId === item.supplierId &&
      row.packLabel === item.packLabel
        ? { ...row, qty }
        : row
    )
    .filter((row) => row.qty > 0);
  writeComboItems(next);
  return next;
}

export function quoteComboGroups(items: ComboItem[]): ComboQuote[] {
  const bySupplier = new Map<string, ComboItem[]>();
  for (const item of items) {
    const list = bySupplier.get(item.supplierId) ?? [];
    list.push(item);
    bySupplier.set(item.supplierId, list);
  }

  return [...bySupplier.entries()]
    .map(([supplierId, group]) => {
      const supplier = supplierById(supplierId);
      if (!supplier) return null;

      const goods = round2(
        group.reduce((sum, item) => sum + item.price * (item.qty || 1), 0)
      );
      const itemCount = group.reduce((sum, item) => sum + (item.qty || 1), 0);
      const combined = quoteShipment({
        supplier,
        goodsEur: goods,
        itemCount,
      });

      const separateShipping = round2(
        group.reduce((sum, item) => sum + item.shipping * (item.qty || 1), 0)
      );
      const separateCustoms = round2(
        group.reduce((sum, item) => sum + item.customs * (item.qty || 1), 0)
      );
      const separateTotal = round2(
        group.reduce((sum, item) => sum + item.total * (item.qty || 1), 0)
      );

      const saved = round2(Math.max(0, separateTotal - combined.total));
      const reasons: string[] = [];
      if (separateShipping - combined.shipping > 0.5) {
        reasons.push(
          `една доставка вместо ${itemCount} отделни: €${round2(
            separateShipping - combined.shipping
          ).toFixed(2)}`
        );
      }
      if (separateCustoms - combined.amount > 0.5) {
        reasons.push(
          `една куриерска/митническа такса вместо ${itemCount} отделни: €${round2(
            separateCustoms - combined.amount
          ).toFixed(2)}`
        );
      }
      const checkout = shopCheckoutInfo(supplier);
      const remainingToFree = remainingToFreeShipping(supplier, goods);
      if (remainingToFree === 0 && checkout.freeShippingFrom) {
        reasons.push(
          `прагът за безплатна доставка (${checkout.freeShippingFrom} €${
            checkout.freeShippingIsNet ? " нето" : ""
          }) е покрит`
        );
      } else if (remainingToFree && remainingToFree > 0) {
        reasons.push(
          `още ${remainingToFree.toFixed(2)} € до безплатна доставка (от ${
            checkout.freeShippingFrom
          } €${checkout.freeShippingIsNet ? " нето" : ""})`
        );
      }

      return {
        supplierId,
        supplierName: supplier.name,
        region: supplier.region,
        itemCount,
        goods,
        separateShipping,
        separateCustoms,
        separateTotal,
        combinedShipping: combined.shipping,
        combinedCustoms: combined.amount,
        combinedTotal: combined.total,
        saved,
        reasons,
        freeShippingFrom: checkout.freeShippingFrom,
        remainingToFree,
        freeShippingIsNet: checkout.freeShippingIsNet,
        issuesEuInvoice: checkout.issuesEuInvoice,
      };
    })
    .filter((row): row is ComboQuote => Boolean(row))
    .sort((a, b) => b.saved - a.saved);
}
