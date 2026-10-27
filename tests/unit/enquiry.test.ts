import { test } from "node:test";
import assert from "node:assert/strict";
import { enquirySchema } from "../../lib/enquiry-schema.ts";
import { deliverEnquiry, deliveryChannel } from "../../lib/enquiry-delivery.ts";

const valid = {
  challengeType: "store",
  challenge: "We sell ceramics on Instagram and want an online store.",
  stage: "existing-product",
  areas: ["websites", "marketing"],
  budget: "5k-15k",
  timing: "1-3-months",
  name: "Ani",
  email: "ani@example.com",
  company: "",
  phone: "",
  serviceId: "online-store",
  locale: "en",
  website: "",
};

test("valid enquiry parses", () => {
  const r = enquirySchema.safeParse(valid);
  assert.equal(r.success, true);
});

test("validation errors carry message keys used by the form", () => {
  const r = enquirySchema.safeParse({ ...valid, challenge: "short", email: "nope", name: "" });
  assert.equal(r.success, false);
  const byField = Object.fromEntries(r.error!.issues.map((i) => [String(i.path[0]), i.message]));
  assert.equal(byField.challenge, "challenge_short");
  assert.equal(byField.email, "email_invalid");
  assert.equal(byField.name, "name_required");
});

test("unknown service ids and categories are rejected", () => {
  assert.equal(enquirySchema.safeParse({ ...valid, serviceId: "rocket" }).success, false);
  assert.equal(enquirySchema.safeParse({ ...valid, areas: ["websites", "space"] }).success, false);
});

test("no delivery channel configured → not_configured, nothing sent", async () => {
  let called = false;
  const fakeFetch = (async () => {
    called = true;
    return new Response(null, { status: 200 });
  }) as typeof fetch;
  const r = await deliverEnquiry(enquirySchema.parse(valid), {} as NodeJS.ProcessEnv, fakeFetch);
  assert.deepEqual(r, { ok: false, reason: "not_configured" });
  assert.equal(called, false);
  assert.equal(deliveryChannel({} as NodeJS.ProcessEnv), null);
});

test("webhook delivery posts JSON with HMAC signature; non-2xx counts as failure", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const env = { ENQUIRY_WEBHOOK_URL: "https://hooks.example.test/brief", ENQUIRY_WEBHOOK_SECRET: "s3cret" } as unknown as NodeJS.ProcessEnv;
  const ok = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;
  const r = await deliverEnquiry(enquirySchema.parse(valid), env, ok);
  assert.deepEqual(r, { ok: true, channel: "webhook" });
  assert.equal(calls[0].url, "https://hooks.example.test/brief");
  const headers = calls[0].init.headers as Record<string, string>;
  assert.match(headers["X-ONYQ-Signature"], /^[a-f0-9]{64}$/);
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.enquiry.email, "ani@example.com");
  assert.equal("website" in body.enquiry, false);

  const failing = (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch;
  assert.deepEqual(await deliverEnquiry(enquirySchema.parse(valid), env, failing), { ok: false, reason: "failed" });
  const throwing = (async () => {
    throw new Error("offline");
  }) as unknown as typeof fetch;
  assert.deepEqual(await deliverEnquiry(enquirySchema.parse(valid), env, throwing), { ok: false, reason: "failed" });
});

test("email channel requires all three Resend variables", () => {
  assert.equal(deliveryChannel({ RESEND_API_KEY: "k", ENQUIRY_TO_EMAIL: "a@b.c" } as unknown as NodeJS.ProcessEnv), null);
  assert.equal(
    deliveryChannel({ RESEND_API_KEY: "k", ENQUIRY_TO_EMAIL: "a@b.c", ENQUIRY_FROM_EMAIL: "w@b.c" } as unknown as NodeJS.ProcessEnv),
    "email",
  );
});
