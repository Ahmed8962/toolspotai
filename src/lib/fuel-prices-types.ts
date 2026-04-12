/** OpenVan.camp /api/fuel/prices — subset we use in the app */
export type OpenVanFuelRow = {
  country_code: string;
  country_name: string;
  region: string;
  currency: string;
  local_currency: string;
  unit: "liter" | "gallon" | string;
  prices: {
    gasoline: number | null;
    diesel: number | null;
    lpg: number | null;
    e85: number | null;
    premium: number | null;
  };
  price_changes: {
    gasoline: number | null;
    diesel: number | null;
    lpg: number | null;
    e85: number | null;
    premium: number | null;
  };
  fetched_at: string;
  sources?: string;
  sources_count?: number;
  is_excluded?: boolean;
};

export type OpenVanFuelApiResponse = {
  success: boolean;
  data: Record<string, OpenVanFuelRow>;
};

export type FuelPricesApiPayload = {
  success: true;
  detectedCountry: string | null;
  suggestedCountry: string;
  countries: { code: string; name: string; region: string }[];
  rows: Record<string, OpenVanFuelRow>;
  openVanUpdated?: string;
};

export type WholesalePoint = { date: string; brent: number | null; wti: number | null };

export type FuelWholesaleApiPayload = {
  success: true;
  points: WholesalePoint[];
  unit: "USD per barrel";
  disclaimer: string;
  sources: string[];
};
