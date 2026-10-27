/**
 * Deterministic number formatting. Intl output for "hy" differs between Node builds and
 * browsers (some ship without Armenian locale data), which breaks hydration — so grouping is
 * done here with the CLDR conventions for each site language.
 */
const GROUP: Record<string, string> = { en: ",", ru: " ", hy: " " };
const DECIMAL: Record<string, string> = { en: ".", ru: ",", hy: "," };

export function formatNumber(value: number, locale = "en", fractionDigits = 0): string {
  const lang = locale.slice(0, 2);
  const group = GROUP[lang] ?? ",";
  const decimal = DECIMAL[lang] ?? ".";
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [int, frac] = fixed.split(".");
  // Russian style leaves four-digit numbers ungrouped (5000), CLDR "minimumGroupingDigits: 2".
  const grouped = lang !== "en" && int.length <= 4 ? int : int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return `${negative ? "−" : ""}${grouped}${frac ? decimal + frac : ""}`;
}

/** "$790" in English; "790 $" in Russian and Armenian (CLDR currency pattern). */
export function formatUsd(amount: number, locale = "en"): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  const n = formatNumber(amount, locale, hasCents ? 2 : 0);
  return locale.startsWith("en") ? `$${n}` : `${n} $`;
}
