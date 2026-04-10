/**
 * Shared currency/locale configuration for finance calculators.
 * Covers US, UK, EU (Euro), India — the main regions where EMI/mortgage/discount
 * tools get traffic.
 */

export type CurrencyCode = "USD" | "GBP" | "EUR" | "INR";

export type CurrencyConfig = {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
  flag: string;
};

export const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US", flag: "🇺🇸" },
  { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB", flag: "🇬🇧" },
  { code: "EUR", symbol: "€", label: "Euro", locale: "de-DE", flag: "🇪🇺" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", locale: "en-IN", flag: "🇮🇳" },
];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]!;
}

export function formatMoney(
  n: number,
  code: CurrencyCode = "USD",
  decimals = 2,
): string {
  const cfg = getCurrencyConfig(code);
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatNum(
  n: number,
  code: CurrencyCode = "USD",
  decimals = 2,
): string {
  const cfg = getCurrencyConfig(code);
  return new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}
