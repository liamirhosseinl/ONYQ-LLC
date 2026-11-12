/**
 * CMS tree helpers, shared by the server and the admin editor.
 *
 * The site's copy lives in code (content/<locale>, messages/<locale>.json, data/*). The CMS
 * stores only *overrides*: a sparse tree holding the values an editor changed. At render time
 * the override is merged over the code default, so fields added to the code later still show
 * up, and "reset" is simply removing a value from the override.
 *
 * Merge rules: plain objects merge key by key; arrays and primitives are replaced whole.
 * A value whose type no longer matches the default (after a code change) is ignored.
 */

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export type JsonObject = { [k: string]: Json };
export type Path = (string | number)[];

export function isPlainObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sameKind(a: unknown, b: unknown): boolean {
  if (Array.isArray(a)) return Array.isArray(b);
  if (isPlainObject(a)) return isPlainObject(b);
  if (a === null || a === undefined) return true;
  return typeof a === typeof b;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

/** Default + override → effective value. Never mutates its inputs. */
export function mergeOverride<T>(defaults: T, override: unknown): T {
  if (override === undefined) return defaults;
  if (isPlainObject(defaults) && isPlainObject(override)) {
    const out: Record<string, unknown> = { ...defaults };
    for (const [k, v] of Object.entries(override)) {
      const d = (defaults as Record<string, unknown>)[k];
      // Keys that exist only in the override (e.g. a service added in the CMS) are kept.
      out[k] = d === undefined ? v : mergeOverride(d, v);
    }
    return out as T;
  }
  return sameKind(defaults, override) ? (override as T) : defaults;
}

/** The sparse override that turns `defaults` into `value` (undefined = no change). */
export function diffOverride(defaults: unknown, value: unknown): Json | undefined {
  if (isPlainObject(defaults) && isPlainObject(value)) {
    const out: JsonObject = {};
    for (const [k, v] of Object.entries(value)) {
      const d = diffOverride(defaults[k], v);
      if (d !== undefined) out[k] = d;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return deepEqual(defaults, value) ? undefined : (value as Json);
}

export function getAt(tree: unknown, path: Path): unknown {
  let cur: unknown = tree;
  for (const p of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[p];
  }
  return cur;
}

/** Returns a copy of `tree` with `value` at `path` (copy-on-write along the path). */
export function setAt<T>(tree: T, path: Path, value: unknown): T {
  if (!path.length) return value as T;
  const [head, ...rest] = path;
  if (Array.isArray(tree)) {
    const copy = tree.slice();
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy as T;
  }
  const obj = (isPlainObject(tree) ? tree : {}) as Record<string, unknown>;
  return { ...obj, [head]: setAt(obj[head as string], rest, value) } as T;
}

/** Every string leaf with its path, in document order. */
export function stringLeaves(tree: unknown, base: Path = []): { path: Path; value: string }[] {
  if (typeof tree === "string") return [{ path: base, value: tree }];
  if (Array.isArray(tree)) return tree.flatMap((v, i) => stringLeaves(v, [...base, i]));
  if (isPlainObject(tree)) return Object.entries(tree).flatMap(([k, v]) => stringLeaves(v, [...base, k]));
  return [];
}

export const pathKey = (p: Path) => p.join(".");

/** Small, stable string hash (FNV-1a) — used to tell when an English source changed. */
export function hashText(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Placeholders that the code fills in: ICU arguments ({count}, {name}) and rich-text tags
 * (<b>…</b>). A translation must keep exactly the same set, or the page would break.
 */
export function placeholders(s: string): string[] {
  const out = new Set<string>();
  for (const m of s.matchAll(/\{\s*([A-Za-z_][\w]*)/g)) out.add(`{${m[1]}}`);
  for (const m of s.matchAll(/<\/?([A-Za-z][\w-]*)>/g)) out.add(`<${m[1]}>`);
  return [...out].sort();
}
