import { test } from "node:test";
import assert from "node:assert/strict";
import { composePhone, formatPhone, isValidPhone, examplePhone } from "../../lib/phone.ts";
import { enquirySchema } from "../../lib/enquiry-schema.ts";
import { VIP_DISCOUNT_PERCENT, vipPriceUsd, vipQuote, vipRequestSchema } from "../../lib/vip.ts";
import { parseVipCode } from "../../lib/server/vip.ts";
import { services } from "../../data/services.ts";

test("phone: real numbers pass and are normalised, fillers and wrong lengths fail", () => {
  assert.equal(formatPhone("+374 94 809506"), "+374 94 809506");
  assert.equal(formatPhone(composePhone("AM", "094809506")), "+374 94 809506"); // trunk 0 dropped
  assert.equal(formatPhone("+79161234567"), "+7 916 123 45 67");
  assert.ok(isValidPhone("+1 415 555 2671"));
  for (const bad of ["+374 9480950", "+374 948095061", "+374 00 000000", "+374 55 555555", "+374 12 345678", "+1 123 456 7890", "12345", "hello"]) {
    assert.equal(isValidPhone(bad), false, bad);
  }
  assert.match(examplePhone("AM"), /^\d/);
});

test("brief: phone is optional, but a bogus one is rejected", () => {
  const base = { challengeType: "website", challenge: "A new website for our bakery", stage: "new-idea", name: "Ann", email: "ann@example.com" };
  assert.ok(enquirySchema.safeParse({ ...base, phone: "" }).success);
  const ok = enquirySchema.safeParse({ ...base, phone: "+37494809506" });
  assert.ok(ok.success);
  assert.equal(ok.data.phone, "+374 94 809506");
  const bad = enquirySchema.safeParse({ ...base, phone: "+374 11" });
  assert.equal(bad.success, false);
  assert.equal(bad.error.issues[0].message, "phone_invalid");
});

test("vip: invitation codes end in the secret suffix and carry the business name", () => {
  assert.deepEqual(parseVipCode("onyq/963"), { business: "onyq" });
  assert.deepEqual(parseVipCode("  Café  Aragats /963 "), { business: "Café Aragats" });
  for (const bad of ["onyq/962", "onyq963", "/963", "a/963", "onyq/9631", "", "onyq/ 963x"]) assert.equal(parseVipCode(bad), null, bad);
  assert.equal(parseVipCode("<b>x</b>/963")?.business, "bx/b");
});

test("vip: every price is 60% off and totals are computed from the catalogue", () => {
  assert.equal(VIP_DISCOUNT_PERCENT, 60);
  for (const s of services) assert.equal(vipPriceUsd(s.regularPriceUsd), Math.round(s.regularPriceUsd * 40) / 100);
  const q = vipQuote(["landing-page", "seo", "landing-page"]);
  assert.equal(q.lines.length, 2);
  assert.deepEqual(q.oneTime, { regularUsd: 790, vipUsd: 316 });
  assert.deepEqual(q.monthly, { regularUsd: 350, vipUsd: 140 });
});

test("vip: request needs services, a description, a name and a real phone; email optional", () => {
  const base = { code: "onyq/963", needs: "A booking site and a bot", services: ["landing-page"], name: "Ann", phone: "+374 94 809506" };
  assert.ok(vipRequestSchema.safeParse(base).success);
  assert.ok(vipRequestSchema.safeParse({ ...base, email: "" }).success);
  assert.equal(vipRequestSchema.safeParse({ ...base, services: [] }).success, false);
  assert.equal(vipRequestSchema.safeParse({ ...base, phone: "" }).success, false);
  assert.equal(vipRequestSchema.safeParse({ ...base, services: ["gamification-loyalty"] }).success, false);
});
