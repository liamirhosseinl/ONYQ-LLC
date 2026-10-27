import "server-only";
import { MIGRATIONS } from "./migrations.mjs";
import { DatabaseSync } from "node:sqlite";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

/**
 * One SQLite database (Node's built-in node:sqlite — no native add-ons) holds everything the
 * admin panel manages: analytics, leads, clients, deals, invoices, tasks, users and the audit
 * log. Location: $ONYQ_DATA_DIR/onyq.db (default ./storage). Put that folder on a persistent,
 * backed-up volume in production (see docs/deployment.md).
 *
 * Migrations are append-only: add a new entry to MIGRATIONS, never edit an old one.
 */

// The schema lives in migrations.mjs (shared with scripts/admin.mjs).


let instance: DatabaseSync | null = null;

export function dataDir(): string {
  return path.resolve(process.env.ONYQ_DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "storage"));
}

export function db(): DatabaseSync {
  if (instance) return instance;
  const dir = dataDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, "onyq.db");
  const d = new DatabaseSync(file);
  try {
    chmodSync(file, 0o600); // only the server's own user may read the database
  } catch {}
  d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 4000; PRAGMA synchronous = NORMAL;");
  const version = (d.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;
  for (let v = version; v < MIGRATIONS.length; v++) {
    d.exec("BEGIN");
    try {
      d.exec(MIGRATIONS[v]);
      d.exec(`PRAGMA user_version = ${v + 1}`);
      d.exec("COMMIT");
    } catch (e) {
      d.exec("ROLLBACK");
      throw e;
    }
  }
  instance = d;
  ensureSetupToken(d, dir);
  if (process.env.NODE_ENV === "production" && process.env.ONYQ_TRUST_PROXY !== "1") {
    console.warn("[onyq] ONYQ_TRUST_PROXY is not set: visitor IPs are not read from proxy headers, so all visitors share one rate-limit bucket. Behind Caddy/nginx set ONYQ_TRUST_PROXY=1 (docs/deployment.md).");
  }
  return d;
}

/**
 * First run: while there is no admin user, a one-time setup token is written to
 * storage/setup-token.txt (readable only by the server's user). Whoever can read that file on the
 * server can create the owner account at /admin/setup; the file is deleted afterwards.
 */
function ensureSetupToken(d: DatabaseSync, dir: string) {
  const n = (d.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  const file = path.join(dir, "setup-token.txt");
  if (n === 0 && !existsSync(file)) {
    const token = randomBytes(24).toString("base64url");
    writeFileSync(file, token + "\n", { mode: 0o600 });
    console.info(`[onyq] No admin account yet. Open /admin/setup and use the token in ${file}`);
  }
}

/** Run a function inside a transaction. */
export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    d.exec("COMMIT");
    return out;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

export type Row = Record<string, string | number | null>;

// node:sqlite returns null-prototype objects; copy them so they can cross into Client Components.
export function all<T = Row>(sql: string, ...params: (string | number | null)[]): T[] {
  return db().prepare(sql).all(...params).map((r) => ({ ...r })) as T[];
}

export function get<T = Row>(sql: string, ...params: (string | number | null)[]): T | undefined {
  const r = db().prepare(sql).get(...params);
  return r ? ({ ...r } as T) : undefined;
}

export function run(sql: string, ...params: (string | number | null)[]) {
  return db().prepare(sql).run(...params);
}
