import type { FuelPriceBulletin, BulletinFuelKey } from "@/data/fuel-price-overrides";
import { FUEL_PRICE_BULLETINS } from "@/data/fuel-price-overrides";
import type { OpenVanFuelRow } from "@/lib/fuel-prices-types";

function cloneRow(row: OpenVanFuelRow): OpenVanFuelRow {
  return {
    ...row,
    prices: { ...row.prices },
    price_changes: { ...row.price_changes },
  };
}

/** Merge curated bulletin prices into OpenVan rows (shallow per country). */
export function applyFuelBulletins(
  rows: Record<string, OpenVanFuelRow>,
): Record<string, OpenVanFuelRow> {
  const out: Record<string, OpenVanFuelRow> = { ...rows };

  for (const [code, bulletin] of Object.entries(FUEL_PRICE_BULLETINS) as [
    string,
    FuelPriceBulletin,
  ][]) {
    const row = out[code];
    if (!row || !bulletin?.prices) continue;

    const next = cloneRow(row);
    const syncedKeys: Array<keyof OpenVanFuelRow["prices"]> = [];

    (Object.entries(bulletin.prices) as [BulletinFuelKey, number][]).forEach(
      ([key, value]) => {
        if (typeof value !== "number" || !Number.isFinite(value)) return;
        next.prices[key] = value;
        syncedKeys.push(key);
        if (bulletin.suppressAggregateDeltasForOverrides) {
          next.price_changes[key] = null;
        }
      },
    );

    if (syncedKeys.length > 0) {
      next.bulletinSync = {
        effectiveFrom: bulletin.effectiveFrom,
        citation: bulletin.citation,
        sourceUrl: bulletin.sourceUrl,
        keys: syncedKeys,
      };
      const extra = `ToolSpotAI bulletin sync (${bulletin.effectiveFrom})`;
      next.sources = next.sources
        ? next.sources.includes(extra)
          ? next.sources
          : `${next.sources} · ${extra}`
        : extra;
    }

    out[code] = next;
  }

  return out;
}
