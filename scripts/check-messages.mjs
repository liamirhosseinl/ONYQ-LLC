// Reports missing translation keys for every locale compared with messages/en.json.
// Exits with code 1 if an ENABLED locale is incomplete, so it can gate CI.
import { readFileSync } from "node:fs";

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    k === "_meta" ? [] : v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

const localesSource = readFileSync(new URL("../data/locales.ts", import.meta.url), "utf8");
const enabled = /ENABLED_LOCALES:\s*AppLocale\[\]\s*=\s*\[([^\]]*)\]/.exec(localesSource)?.[1]
  .split(",")
  .map((s) => s.trim().replace(/["']/g, ""))
  .filter(Boolean) ?? ["en"];

const base = new Set(flatten(JSON.parse(readFileSync(new URL("../messages/en.json", import.meta.url)))));
let failed = false;
for (const locale of ["ru", "hy"]) {
  const keys = new Set(flatten(JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url)))));
  const missing = [...base].filter((k) => !keys.has(k));
  const isEnabled = enabled.includes(locale);
  console.log(`${locale}: ${base.size - missing.length}/${base.size} keys${isEnabled ? " (ENABLED)" : " (disabled)"}`);
  if (isEnabled && missing.length) {
    failed = true;
    console.log(`  missing: ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? " …" : ""}`);
  }
}
process.exit(failed ? 1 : 0);
