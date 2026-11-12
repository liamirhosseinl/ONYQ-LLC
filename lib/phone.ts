import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js/min";
import examples from "libphonenumber-js/examples.mobile.json";

/**
 * Phone numbers for the brief and the VIP request.
 *
 * The visitor picks a country (flag + calling code) and types the national number. The
 * value travels as one international string ("+374 94 809506"). The browser and the server
 * run the same check (libphonenumber "min" metadata): the number must have a valid length
 * and prefix for its country, and it must not be an obvious filler such as 000000 or 123456.
 */

export type { CountryCode };

export const DEFAULT_COUNTRY: CountryCode = "AM";

/** Countries offered first in the picker, in this order. */
export const PINNED_COUNTRIES: CountryCode[] = ["AM", "RU", "US", "GE", "AE", "FR", "DE", "GB"];

export const COUNTRIES: CountryCode[] = getCountries();

export function callingCode(country: CountryCode): string {
  return getCountryCallingCode(country);
}

export function isCountry(value: unknown): value is CountryCode {
  return typeof value === "string" && (COUNTRIES as string[]).includes(value);
}

/** Digits only. */
export function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

/** Filler numbers people type to get past a form: one or two repeated digits, or a run like 1234567. */
function looksFake(national: string): boolean {
  if (new Set(national).size <= 2) return true;
  const ascending = "01234567890123456789";
  const descending = "98765432109876543210";
  return national.length >= 6 && (ascending.includes(national) || descending.includes(national));
}

/** Parses "+374 94 809506" (or a national number with a country) into a checked number. */
export function checkPhone(value: string, country?: CountryCode) {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = raw.startsWith("+") ? parsePhoneNumberFromString(raw) : country ? parsePhoneNumberFromString(raw, country) : undefined;
  if (!parsed || !parsed.isValid()) return null;
  if (looksFake(String(parsed.nationalNumber))) return null;
  return parsed;
}

/** True for a real-looking phone number in international form. */
export function isValidPhone(value: string): boolean {
  return checkPhone(value) !== null;
}

/** Normalised international form ("+374 94 809506"), or null when the number is not valid. */
export function formatPhone(value: string): string | null {
  return checkPhone(value)?.formatInternational() ?? null;
}

/** The full value stored in the form for a country and the digits typed for it. */
export function composePhone(country: CountryCode, national: string): string {
  const digits = digitsOf(national).replace(/^0+/, (zeros) => (country === "IT" ? zeros : ""));
  return digits ? `+${callingCode(country)} ${digits}` : "";
}

/** The national part of a stored value, for showing it back in the input. */
export function nationalPart(value: string, country: CountryCode): string {
  const code = `+${callingCode(country)}`;
  const v = value.trim();
  return v.startsWith(code) ? v.slice(code.length).trim() : v.startsWith("+") ? "" : v;
}

/** Formats the national digits as the visitor types ("94 809 506"). */
export function formatAsYouType(country: CountryCode, national: string): string {
  const digits = digitsOf(national);
  if (!digits) return "";
  const code = callingCode(country);
  const typed = new AsYouType().input(`+${code}${digits}`);
  return typed.startsWith(`+${code}`) ? typed.slice(code.length + 1).trim() : digits;
}

/** True when another digit would make the number too long for its country. */
export function isTooLong(country: CountryCode, national: string): boolean {
  const digits = digitsOf(national);
  return digits.length > 0 && validatePhoneNumberLength(digits, country) === "TOO_LONG";
}

/** An example mobile number for the placeholder ("77 123456"), so the right length is obvious. */
export function examplePhone(country: CountryCode): string {
  try {
    const intl = getExampleNumber(country, examples)?.formatInternational() ?? "";
    return intl.replace(`+${callingCode(country)}`, "").trim();
  } catch {
    return "";
  }
}

/** When someone pastes a full international number, find its country. */
export function detectCountry(value: string): CountryCode | undefined {
  if (!value.trim().startsWith("+")) return undefined;
  return parsePhoneNumberFromString(value)?.country;
}
