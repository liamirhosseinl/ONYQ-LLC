#!/usr/bin/env node
/**
 * ONYQ admin recovery tool — run it on the server (or the computer that runs the site), in the
 * project folder. Only someone with access to that machine can use it, which is the point: it is
 * the safe way back in when a password or authenticator is lost.
 *
 *   npm run admin -- users                       list accounts
 *   npm run admin -- reset-password <email>      new one-time password (must be changed at sign-in)
 *   npm run admin -- disable-2fa <email>         turn off two-step sign-in for a lost phone
 *   npm run admin -- set-email <old> <new>       change an account's sign-in email
 *   npm run admin -- setup-token                 new first-run token (only while no account exists)
 *
 * Uses $ONYQ_DATA_DIR (default ./storage), exactly like the site.
 */
import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomInt, scrypt as scryptCb } from "node:crypto";
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { promisify } from "node:util";
import path from "node:path";
import { MIGRATIONS } from "../lib/server/migrations.mjs";

const scrypt = promisify(scryptCb);
const SCRYPT = { N: 1 << 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

/** 4 groups of 5 unambiguous characters, e.g. "K7MPX-RT2QH-9WNCA-F4JDE" (~100 bits). */
function tempPassword() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => Array.from({ length: 5 }, () => A[randomInt(A.length)]).join("")).join("-");
}

function open() {
  const dir = path.resolve(process.env.ONYQ_DATA_DIR || path.join(process.cwd(), "storage"));
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, "onyq.db");
  const d = new DatabaseSync(file);
  try { chmodSync(file, 0o600); } catch {}
  d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 4000;");
  const version = d.prepare("PRAGMA user_version").get().user_version;
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
  return { d, dir };
}

function audit(d, action, meta) {
  d.prepare("INSERT INTO audit_log (ts, user_id, action, entity, entity_id, meta, ip) VALUES (?, NULL, ?, NULL, NULL, ?, 'console')").run(Date.now(), action, JSON.stringify(meta));
}

function userByEmail(d, email) {
  const u = d.prepare("SELECT id, email, name, role FROM users WHERE email = ?").get(String(email || "").trim().toLowerCase());
  if (!u) {
    console.error(`No account with the email "${email}". Run: npm run admin -- users`);
    process.exit(1);
  }
  return u;
}

const [cmd, a1, a2] = process.argv.slice(2);
const { d, dir } = open();

switch (cmd) {
  case "users": {
    const rows = d.prepare("SELECT id, email, name, role, totp_enabled, disabled, must_change_password, last_login_at FROM users ORDER BY id").all();
    if (!rows.length) console.log("No accounts yet. Run: npm run admin -- setup-token");
    for (const u of rows) {
      console.log(
        `#${u.id}  ${u.email}  (${u.name}, ${u.role})` +
          `${u.totp_enabled ? "  · 2FA on" : ""}${u.disabled ? "  · DISABLED" : ""}${u.must_change_password ? "  · temporary password" : ""}` +
          `  · last sign-in: ${u.last_login_at ? new Date(u.last_login_at).toISOString().slice(0, 16).replace("T", " ") : "never"}`,
      );
    }
    break;
  }
  case "reset-password": {
    const u = userByEmail(d, a1);
    const pw = tempPassword();
    d.prepare("UPDATE users SET password_hash = ?, must_change_password = 1, disabled = 0 WHERE id = ?").run(await hashPassword(pw), u.id);
    d.prepare("DELETE FROM sessions WHERE user_id = ?").run(u.id);
    d.prepare("DELETE FROM rate_limits WHERE bucket = ?").run(`login-email:${u.email}`);
    audit(d, "user.password_reset_console", { email: u.email });
    console.log(`\nTemporary password for ${u.email}:\n\n    ${pw}\n\nSign in at /admin/login with it — you'll be asked to choose your own password right away.\nAll of this account's sessions were signed out.\n`);
    break;
  }
  case "disable-2fa": {
    const u = userByEmail(d, a1);
    d.prepare("UPDATE users SET totp_enabled = 0, totp_secret = NULL, totp_last_step = 0 WHERE id = ?").run(u.id);
    d.prepare("DELETE FROM sessions WHERE user_id = ?").run(u.id);
    audit(d, "user.mfa_disabled_console", { email: u.email });
    console.log(`Two-step sign-in is off for ${u.email}. Turn it on again in Settings after signing in.`);
    break;
  }
  case "set-email": {
    const u = userByEmail(d, a1);
    const next = String(a2 || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      console.error("Give the new email as the second value.");
      process.exit(1);
    }
    d.prepare("UPDATE users SET email = ? WHERE id = ?").run(next, u.id);
    audit(d, "user.email_console", { from: u.email, to: next });
    console.log(`Sign-in email changed: ${u.email} → ${next}`);
    break;
  }
  case "setup-token": {
    const n = d.prepare("SELECT COUNT(*) AS n FROM users").get().n;
    if (n > 0) {
      console.error("Accounts already exist, so first-run setup is closed. Use: npm run admin -- reset-password <email>");
      process.exit(1);
    }
    const token = randomBytes(24).toString("base64url");
    writeFileSync(path.join(dir, "setup-token.txt"), token + "\n", { mode: 0o600 });
    console.log(`Setup token (also saved in ${path.join(dir, "setup-token.txt")}):\n\n    ${token}\n\nOpen /admin/setup and paste it.`);
    break;
  }
  default:
    console.log(`ONYQ admin recovery tool

  npm run admin -- users                       list accounts
  npm run admin -- reset-password <email>      new one-time password
  npm run admin -- disable-2fa <email>         turn off two-step sign-in (lost phone)
  npm run admin -- set-email <old> <new>       change the sign-in email
  npm run admin -- setup-token                 new first-run token (no accounts yet)`);
}
d.close();
