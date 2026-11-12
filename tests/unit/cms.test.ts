import { test } from "node:test";
import assert from "node:assert/strict";
import { deepEqual, diffOverride, getAt, hashText, mergeOverride, placeholders, setAt, stringLeaves } from "../../lib/cms/merge.ts";
import { docList, humanKey } from "../../lib/cms/registry.ts";

const defaults = {
  hero: { title: ["intelligence,", "naturally."], lead: "Original lead", cta: "Start" },
  items: [{ q: "One?", a: "Yes" }],
  count: 3,
};

test("cms: an override changes only what it names; new code fields still appear", () => {
  const merged = mergeOverride(defaults, { hero: { lead: "New lead" } });
  assert.equal(merged.hero.lead, "New lead");
  assert.equal(merged.hero.cta, "Start");
  assert.deepEqual(merged.hero.title, ["intelligence,", "naturally."]);
  assert.equal(defaults.hero.lead, "Original lead", "defaults are never mutated");
});

test("cms: lists are replaced whole and mismatched types are ignored", () => {
  const merged = mergeOverride(defaults, { items: [{ q: "A", a: "B" }, { q: "C", a: "D" }], count: "nope", hero: "broken" });
  assert.equal(merged.items.length, 2);
  assert.equal(merged.count, 3);
  assert.equal(merged.hero.lead, "Original lead");
});

test("cms: diff stores only the changes, and nothing when nothing changed", () => {
  assert.equal(diffOverride(defaults, structuredClone(defaults)), undefined);
  const edited = setAt(structuredClone(defaults), ["hero", "lead"], "Edited");
  assert.deepEqual(diffOverride(defaults, edited), { hero: { lead: "Edited" } });
  const listEdit = setAt(structuredClone(defaults), ["items", 0, "a"], "No");
  assert.deepEqual(diffOverride(defaults, listEdit), { items: [{ q: "One?", a: "No" }] });
  assert.ok(deepEqual(mergeOverride(defaults, diffOverride(defaults, listEdit)), listEdit));
});

test("cms: path helpers", () => {
  assert.equal(getAt(defaults, ["items", 0, "q"]), "One?");
  assert.equal(getAt(defaults, ["missing", "x"]), undefined);
  assert.equal(stringLeaves(defaults).length, 6);
  assert.notEqual(hashText("a"), hashText("b"));
  assert.equal(hashText("same"), hashText("same"));
});

test("cms: placeholders are found in ICU messages and rich text", () => {
  assert.deepEqual(placeholders("from {count, plural, one {# day} other {# days}}"), ["{count}"]);
  assert.deepEqual(placeholders("Welcome, <b>{business}</b>."), ["<b>", "{business}"]);
  assert.deepEqual(placeholders("Plain text"), []);
});

test("cms: the registry lists pages, services, directions, cases and interface groups", () => {
  const docs = docList({ servicePageSlugs: [{ slug: "landing-page", label: "Landing page" }], topics: [{ slug: "design", label: "Design" }], cases: [{ slug: "familish", label: "Familish" }] });
  const keys = docs.map((d) => d.key);
  for (const k of ["home", "pricing", "faq", "contacts", "portfolio", "service:landing-page", "topic:design", "case:familish", "catalogue", "messages:nav", "messages:vip"]) {
    assert.ok(keys.includes(k), k);
  }
  assert.equal(humanKey("metricLabel"), "Metric label");
  assert.equal(humanKey(0), "#1");
});
