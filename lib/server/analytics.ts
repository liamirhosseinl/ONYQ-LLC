import "server-only";
import { randomBytes } from "node:crypto";
import { get, run } from "./db.ts";
import { sha256 } from "./security.ts";

/**
 * Cookieless, first-party analytics (the Plausible / Fathom model):
 *  - no cookies, no localStorage identifiers, nothing shared with third parties;
 *  - a visitor is a daily-rotating hash of (secret salt + date + IP + user agent), so the same
 *    person can't be followed across days and the IP itself is never stored;
 *  - bots, automated browsers and visitors with Global Privacy Control are not counted.
 */

export function today(ts = Date.now()) {
  return new Date(ts).toISOString().slice(0, 10);
}

function dailySalt(day: string): string {
  const key = `salt:${day}`;
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  if (row) return row.value;
  const salt = randomBytes(24).toString("hex");
  run("INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)", key, salt, Date.now());
  // Forget salts older than two days: yesterday's visitors can no longer be re-identified.
  run("DELETE FROM settings WHERE key LIKE 'salt:%' AND key < ?", `salt:${today(Date.now() - 2 * 86400_000)}`);
  // Once a day: keep raw analytics for 25 months at most (data minimisation).
  const cutoff = Date.now() - 761 * 86400_000;
  run("DELETE FROM pageviews WHERE ts < ?", cutoff);
  run("DELETE FROM events WHERE ts < ?", cutoff);
  run("DELETE FROM rate_limits WHERE ts < ?", Date.now() - 2 * 86400_000);
  return get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key)!.value;
}

export function visitorId(ip: string, ua: string, day = today()): string {
  return sha256(`${dailySalt(day)}|${day}|${ip}|${ua}`).slice(0, 24);
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|telegram|discord|headless|lighthouse|pagespeed|gtmetrix|curl|wget|python|axios|node-fetch|go-http|java\//i;

export function isBot(ua: string) {
  return !ua || BOT.test(ua);
}

export function parseUa(ua: string): { device: string; browser: string; os: string } {
  const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? "tablet" : /mobi|iphone|android/i.test(ua) ? "mobile" : "desktop";
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /yabrowser/i.test(ua)
        ? "Yandex"
        : /samsungbrowser/i.test(ua)
          ? "Samsung"
          : /firefox|fxios/i.test(ua)
            ? "Firefox"
            : /chrome|crios/i.test(ua)
              ? "Chrome"
              : /safari/i.test(ua)
                ? "Safari"
                : "Other";
  const os = /windows/i.test(ua) ? "Windows" : /iphone|ipad|ios/i.test(ua) ? "iOS" : /mac os/i.test(ua) ? "macOS" : /android/i.test(ua) ? "Android" : /linux/i.test(ua) ? "Linux" : "Other";
  return { device, browser, os };
}

/** Country from the CDN / proxy header when present, otherwise the region of the browser language. */
export function countryFrom(headers: Headers): string | null {
  const h = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || headers.get("x-country-code");
  if (h && /^[A-Z]{2}$/i.test(h) && h.toUpperCase() !== "XX") return h.toUpperCase();
  const lang = headers.get("accept-language") || "";
  const m = lang.match(/^[a-z]{2,3}-([A-Z]{2})/);
  return m ? m[1] : null;
}

export function referrerHost(ref: string | undefined, siteHost: string): string | null {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (!host || host === siteHost.replace(/^www\./, "")) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}
