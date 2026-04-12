import type { FuelPricesApiPayload, OpenVanFuelApiResponse } from "@/lib/fuel-prices-types";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const OPENVAN_URL = "https://openvan.camp/api/fuel/prices";

const fetchOpenVan = unstable_cache(
  async (): Promise<OpenVanFuelApiResponse> => {
    const res = await fetch(OPENVAN_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 21_600 },
    });
    if (!res.ok) {
      throw new Error(`openvan_http_${res.status}`);
    }
    const json = (await res.json()) as OpenVanFuelApiResponse;
    if (!json?.success || !json.data || typeof json.data !== "object") {
      throw new Error("openvan_bad_payload");
    }
    return json;
  },
  ["openvan-fuel-prices-v1"],
  { revalidate: 21_600 },
);

function detectCountryCode(req: NextRequest): string | null {
  const raw =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    req.headers.get("cloudfront-viewer-country") ??
    "";
  const code = raw.trim().toUpperCase();
  if (code.length !== 2 || code === "XX" || code === "T1") return null;
  return code;
}

export async function GET(req: NextRequest) {
  try {
    const openVan = await fetchOpenVan();
    const detected = detectCountryCode(req);

    const entries = Object.entries(openVan.data).filter(
      ([, row]) => !row.is_excluded,
    );

    const countries = entries
      .map(([code, row]) => ({
        code,
        name: row.country_name,
        region: row.region,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const rows: Record<string, (typeof openVan.data)[string]> = {};
    for (const [code, row] of entries) {
      rows[code] = row;
    }

    let suggested =
      detected && rows[detected] ? detected : rows["US"] ? "US" : countries[0]?.code ?? "US";

    if (detected && !rows[detected] && rows["US"]) {
      suggested = "US";
    }

    const payload: FuelPricesApiPayload = {
      success: true,
      detectedCountry: detected && rows[detected] ? detected : null,
      suggestedCountry: suggested,
      countries,
      rows,
      openVanUpdated: entries[0]?.[1]?.fetched_at,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "upstream" },
      { status: 502 },
    );
  }
}
