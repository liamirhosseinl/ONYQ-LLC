import { z } from "zod";
import { clientIp, isSafePath, rateLimited, readJson, sameOrigin } from "@/lib/server/security.ts";
import { countryFrom, isBot, parseUa, referrerHost, today, visitorId } from "@/lib/server/analytics.ts";
import { get, run } from "@/lib/server/db.ts";
import { siteConfig } from "@/data/site-config.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (max: number) => z.string().max(max).optional();

const schema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("pv"),
    s: z.string().regex(/^[a-z0-9]{8,32}$/i),
    p: z.string().max(300).refine(isSafePath),
    l: z.enum(["en", "ru", "hy"]).optional(),
    r: str(500),
    us: str(80),
    um: str(80),
    uc: str(120),
    w: z.number().int().min(0).max(10000).optional(),
  }),
  z.object({
    t: z.literal("leave"),
    s: z.string().regex(/^[a-z0-9]{8,32}$/i),
    p: z.string().max(300).refine(isSafePath),
    d: z.number().int().min(0).max(6 * 3600_000),
    sc: z.number().int().min(0).max(100),
  }),
  z.object({
    t: z.literal("ev"),
    s: z.string().regex(/^[a-z0-9]{8,32}$/i),
    p: z.string().max(300).refine(isSafePath).optional(),
    n: z.string().regex(/^[a-z0-9_.-]{2,40}$/),
    m: z.record(z.string().max(40), z.union([z.string().max(120), z.number()])).optional(),
  }),
]);

const ok = () => new Response(null, { status: 204 });

/** Analytics beacon. Always answers 204 so it never reveals whether a hit was counted. */
export async function POST(request: Request) {
  const h = request.headers;
  if (!sameOrigin(h)) return ok();
  const ua = h.get("user-agent") || "";
  if (isBot(ua) || h.get("sec-gpc") === "1") return ok();
  const ip = clientIp(h);
  // Per visitor, plus a site-wide ceiling so a botnet can't flood the database.
  if (rateLimited(`a:${ip}`, 240, 10 * 60_000) || rateLimited("a:all", 20_000, 10 * 60_000)) return ok();

  const body = await readJson(request, 4096);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return ok();
  const e = parsed.data;
  const now = Date.now();
  const day = today(now);
  const visitor = visitorId(ip, ua, day);

  try {
    if (e.t === "pv") {
      const { device, browser, os } = parseUa(ua);
      const site = new URL(siteConfig.url).hostname;
      run(
        `INSERT INTO pageviews (ts, day, visitor, session, path, locale, referrer, utm_source, utm_medium, utm_campaign, country, device, browser, os, screen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        now,
        day,
        visitor,
        e.s,
        e.p.split("?")[0],
        e.l ?? null,
        referrerHost(e.r, h.get("host") || site),
        e.us ?? null,
        e.um ?? null,
        e.uc ?? null,
        countryFrom(h),
        device,
        browser,
        os,
        e.w ? (e.w < 600 ? "S" : e.w < 1100 ? "M" : "L") : null,
      );
    } else if (e.t === "leave") {
      const row = get<{ id: number }>("SELECT id FROM pageviews WHERE session = ? AND path = ? ORDER BY ts DESC LIMIT 1", e.s, e.p.split("?")[0]);
      if (row) run("UPDATE pageviews SET duration_ms = MAX(duration_ms, ?), scroll = MAX(scroll, ?) WHERE id = ?", e.d, e.sc, row.id);
    } else {
      run("INSERT INTO events (ts, day, visitor, session, name, path, meta) VALUES (?, ?, ?, ?, ?, ?, ?)", now, day, visitor, e.s, e.n, e.p ?? null, e.m ? JSON.stringify(e.m) : null);
    }
  } catch {
    // Analytics must never affect the visitor.
  }
  return ok();
}
