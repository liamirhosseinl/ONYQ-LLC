import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { get, run } from "./db.ts";
import { clientIp, randomToken, sha256 } from "./security.ts";

/**
 * Admin sessions.
 *  - Cookie "__Host-onyq_admin": random 256-bit token, HttpOnly, Secure, SameSite=Strict,
 *    Path=/ (the __Host- prefix forbids a Domain attribute and requires Secure).
 *  - Only the SHA-256 of the token is stored, so a database leak can't be replayed.
 *  - Idle timeout 2 h, absolute lifetime 12 h; a password-only session is "mfa_pending" and
 *    can do nothing but finish the second factor.
 */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-onyq_admin" : "onyq_admin_dev";
const IDLE_MS = 2 * 3600_000;
const ABSOLUTE_MS = 12 * 3600_000;
/** A password-only (second factor pending) session lives for 10 minutes at most. */
const MFA_PENDING_MS = 10 * 60_000;

export type Role = "owner" | "admin" | "manager" | "viewer";
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  totp_enabled: number;
  must_change_password: number;
}

const RANK: Record<Role, number> = { viewer: 0, manager: 1, admin: 2, owner: 3 };

export async function createSession(userId: number, mfaPending: boolean) {
  const token = randomToken(32);
  const now = Date.now();
  const h = await headers();
  run(
    "INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at, mfa_pending, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    sha256(token),
    userId,
    now,
    now,
    now + (mfaPending ? MFA_PENDING_MS : ABSOLUTE_MS),
    mfaPending ? 1 : 0,
    clientIp(h),
    (h.get("user-agent") || "").slice(0, 300),
  );
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: (mfaPending ? MFA_PENDING_MS : ABSOLUTE_MS) / 1000,
  });
}

interface SessionRow {
  id: string;
  user_id: number;
  last_seen_at: number;
  expires_at: number;
  mfa_pending: number;
}

async function currentSession(): Promise<SessionRow | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const s = get<SessionRow>("SELECT id, user_id, last_seen_at, expires_at, mfa_pending FROM sessions WHERE id = ?", sha256(token));
  if (!s) return null;
  const now = Date.now();
  if (now > s.expires_at || now - s.last_seen_at > IDLE_MS) {
    run("DELETE FROM sessions WHERE id = ?", s.id);
    return null;
  }
  if (now - s.last_seen_at > 60_000) run("UPDATE sessions SET last_seen_at = ? WHERE id = ?", now, s.id);
  return s;
}

export async function getUser(): Promise<AdminUser | null> {
  const s = await currentSession();
  if (!s || s.mfa_pending) return null;
  const u = get<AdminUser>("SELECT id, email, name, role, totp_enabled, must_change_password FROM users WHERE id = ? AND disabled = 0", s.user_id);
  return u ?? null;
}

/** For the second-factor step only. */
export async function getPendingUserId(): Promise<number | null> {
  const s = await currentSession();
  return s && s.mfa_pending ? s.user_id : null;
}

export async function completeMfa() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return;
  // Rotate the token on privilege change (session fixation defence).
  const old = sha256(token);
  const s = get<SessionRow>("SELECT user_id FROM sessions WHERE id = ?", old);
  run("DELETE FROM sessions WHERE id = ?", old);
  if (s) await createSession(s.user_id, false);
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE id = ?", sha256(token));
  jar.delete(SESSION_COOKIE);
}

/**
 * Use at the top of every admin page and server action. A user who must replace a temporary
 * password can do nothing else until they have (only the password page passes allowTemporary).
 */
export async function requireUser(min: Role = "viewer", opts: { allowTemporary?: boolean } = {}): Promise<AdminUser> {
  const u = await getUser();
  if (!u) redirect("/admin/login");
  if (u.must_change_password && !opts.allowTemporary) redirect("/admin/password");
  if (RANK[u.role] < RANK[min]) redirect("/admin?denied=1");
  return u;
}

export function can(user: AdminUser, min: Role) {
  return RANK[user.role] >= RANK[min];
}
