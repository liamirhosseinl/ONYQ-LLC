import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { services, categories } from "../../data/services.ts";
import { servicePages } from "../../content/en/service-pages.ts";
import { topics } from "../../content/en/topics.ts";
import { serviceCopy, categoryCopy } from "../../content/en/catalogue.ts";
import { home } from "../../content/en/home.ts";
import { pricingPage } from "../../content/en/pricing.ts";
import { DIRECTION_SLUGS, footerPopular, primaryNav } from "../../data/navigation.ts";
import { siteConfig } from "../../data/site-config.ts";
import { ENABLED_LOCALES } from "../../data/locales.ts";
import en from "../../messages/en.json" with { type: "json" };
import ru from "../../messages/ru.json" with { type: "json" };
import hy from "../../messages/hy.json" with { type: "json" };
import { caseStudies } from "../../data/cases.ts";
import { getContent } from "../../content/index.ts";
import { formatNumber, formatUsd } from "../../lib/format.ts";

const appRoutes = new Set(readdirSync(new URL("../../app/[locale]/", import.meta.url)).filter((d) => !d.includes(".")));
const servicePageSlugs = new Set(servicePages.map((p) => p.slug));

function routeExists(path: string): boolean {
  if (path === "/") return true;
  const [, first, second] = path.split("/");
  if (first === "services" && second) return servicePageSlugs.has(second);
  return appRoutes.has(first);
}

test("every service links to an existing detail or direction page", () => {
  for (const s of services) assert.ok(routeExists(s.detailPage), `${s.id} → ${s.detailPage}`);
  for (const c of categories) assert.ok(routeExists(c.directionPage), `${c.id} → ${c.directionPage}`);
});

test("navigation, footer and topic links point to real routes", () => {
  for (const item of primaryNav) {
    assert.ok(routeExists(item.href), item.href);
    if (item.type === "menu") for (const l of item.links) assert.ok(routeExists(l.href), l.href);
  }
  for (const slug of footerPopular) assert.ok(servicePageSlugs.has(slug), slug);
  for (const slug of DIRECTION_SLUGS) assert.ok(appRoutes.has(slug), slug);
  for (const t of Object.values(topics)) for (const r of t.related) assert.ok(appRoutes.has(r), `${t.slug} → ${r}`);
  for (const l of home.promise.links) assert.ok(routeExists(l.href), l.href);
});

test("every catalogue entry has copy, and service pages reference real services", () => {
  for (const s of services) assert.ok(serviceCopy[s.id]?.name && serviceCopy[s.id]?.short, s.id);
  for (const c of categories) assert.ok(categoryCopy[c.id]?.title, c.id);
  const ids = new Set(services.map((s) => s.id));
  for (const p of servicePages) {
    assert.ok(ids.has(p.primary), `${p.slug} primary`);
    for (const id of [...p.priceIds, ...p.seeAlso, ...p.notFit.map((n) => n.alt)]) assert.ok(ids.has(id), `${p.slug} → ${id}`);
    assert.equal(p.priceIds[0], p.primary, `${p.slug} lists its own price first`);
    assert.ok(p.included.length >= 5, `${p.slug} has at least 5 inclusions for the estimate card`);
    assert.equal(p.process.length, 4, `${p.slug} has 4 stages`);
  }
});

test("service pages state the approved starting price in their FAQ and metadata", () => {
  for (const p of servicePages) {
    const s = services.find((x) => x.id === p.primary)!;
    const price = `$${s.regularPriceUsd.toLocaleString("en-US")}`;
    assert.ok(p.meta.title.includes(price) || p.meta.description.includes(price), `${p.slug} meta mentions ${price}`);
    assert.ok(p.faq.some((f) => f.a.includes(price)), `${p.slug} FAQ mentions ${price}`);
  }
});

test("only business facts supplied by ONYQ are configured", () => {
  // Supplied by ONYQ on 29 Oct 2026.
  assert.equal(siteConfig.contact.salesEmail, "onyq.llc@gmail.com");
  assert.equal(siteConfig.contact.phone, "+374 94 809506, +374 94 406207");
  assert.equal(siteConfig.legalName, null);
  assert.equal(siteConfig.taxId, "01384049");
  assert.deepEqual(siteConfig.team, []);
  assert.deepEqual(siteConfig.products, []);
  assert.deepEqual(siteConfig.caseStudies, []);
  assert.equal(siteConfig.legal.privacyPolicy, null);
});

test("commercial commitments were approved by ONYQ (27 Oct 2026) and are published", () => {
  const every = pricingPage.faq.find((f) => f.q.startsWith("Who owns"));
  assert.ok(every);
  assert.equal("approval" in every! ? every.approval : undefined, undefined);
  const yours = home.principles.items.find((i) => i.title === "Yours to keep");
  assert.ok(yours);
  assert.equal("approval" in yours! ? (yours as { approval?: string }).approval : undefined, undefined);
});

test("English, Russian and Armenian are routed with complete message files", () => {
  assert.deepEqual(ENABLED_LOCALES, ["en", "ru", "hy"]);
  const flat = (o: Record<string, unknown>, pre = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v as Record<string, unknown>, pre + k + ".") : [pre + k]));
  const keys = flat(en).sort();
  for (const loc of [ru, hy]) assert.deepEqual(flat(loc).sort(), keys);
});

test("every locale has copy for every case study, page bundle and service page", () => {
  for (const locale of ENABLED_LOCALES) {
    const c = getContent(locale);
    for (const study of caseStudies) {
      const copy = c.cases[study.slug];
      assert.ok(copy, `${locale}: missing case copy for ${study.slug}`);
      for (const img of [study.cover, ...study.gallery]) assert.ok(copy.alts[img.alt], `${locale}: missing alt ${img.alt} for ${study.slug}`);
    }
    assert.equal(c.servicePages.length, servicePages.length, `${locale}: service page count`);
  }
});

test("case studies respect NDA / show_client flags and reference real images and services", () => {
  const bySlug = Object.fromEntries(caseStudies.map((c) => [c.slug, c]));
  assert.equal(bySlug["eagle-vpn"].client, null);
  assert.equal(bySlug["english-institute"].client, null);
  for (const study of caseStudies) {
    for (const img of [study.cover, ...study.gallery]) {
      assert.ok(existsSync(new URL(`../../public${img.src}`, import.meta.url)), `missing ${img.src}`);
    }
    for (const id of study.services) assert.ok(services.some((s) => s.id === id), `unknown service ${id}`);
  }
});

test("number formatting is deterministic across server and browser", () => {
  assert.equal(formatUsd(4900, "en"), "$4,900");
  assert.equal(formatUsd(4900, "hy"), "4900\u00a0$");
  assert.equal(formatNumber(10000, "ru"), "10\u202f000");
});
