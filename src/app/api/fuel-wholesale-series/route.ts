import type { FuelWholesaleApiPayload, WholesalePoint } from "@/lib/fuel-prices-types";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const BRENT_CSV =
  "https://datahub.io/core/oil-prices/_r/-/data/brent-daily.csv";
const WTI_CSV = "https://datahub.io/core/oil-prices/_r/-/data/wti-daily.csv";

const DAYS = 186;

function parseDailyCsv(csv: string): Map<string, number> {
  const map = new Map<string, number>();
  const lines = csv.trim().split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const comma = line.indexOf(",");
    if (comma <= 0) continue;
    const date = line.slice(0, comma).trim();
    const price = parseFloat(line.slice(comma + 1));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(price)) continue;
    map.set(date, price);
  }
  return map;
}

const fetchWholesale = unstable_cache(
  async (): Promise<FuelWholesaleApiPayload> => {
    const [bRes, wRes] = await Promise.all([
      fetch(BRENT_CSV, { next: { revalidate: 43_200 } }),
      fetch(WTI_CSV, { next: { revalidate: 43_200 } }),
    ]);
    if (!bRes.ok || !wRes.ok) {
      throw new Error("oil_csv_http");
    }
    const [bText, wText] = await Promise.all([bRes.text(), wRes.text()]);
    const brent = parseDailyCsv(bText);
    const wti = parseDailyCsv(wText);

    const dates = [...brent.keys()].sort();
    const tail = dates.slice(-DAYS);

    let lastWti: number | null = null;
    const points: WholesalePoint[] = tail.map((date) => {
      const b = brent.get(date) ?? null;
      const wRaw = wti.get(date);
      if (wRaw != null && Number.isFinite(wRaw)) lastWti = wRaw;
      const w = wRaw ?? lastWti;
      return { date, brent: b, wti: w ?? null };
    });

    return {
      success: true,
      points,
      unit: "USD per barrel",
      disclaimer:
        "Brent and WTI are global crude oil benchmarks (wholesale), not national pump prices. They show how oil markets moved over the last ~6 months; retail gasoline and diesel also reflect taxes, refining margins, currency, and local regulation.",
      sources: [
        "Datahub: core/oil-prices (Brent & WTI daily)",
        "Processed on ToolSpotAI for charting only",
      ],
    };
  },
  ["fuel-wholesale-brent-wti-v1"],
  { revalidate: 43_200 },
);

export async function GET() {
  try {
    const payload = await fetchWholesale();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "upstream" },
      { status: 502 },
    );
  }
}
