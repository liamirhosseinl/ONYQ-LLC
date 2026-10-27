"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { all, get, run, tx, dataDir } from "@/lib/server/db.ts";
import { audit } from "@/lib/server/audit.ts";
import {
  clientIp,
  hashPassword,
  newTotpSecret,
  passwordProblem,
  rateLimited,
  safeEqual,
  verifyPassword,
  verifyTotp,
} from "@/lib/server/security.ts";
import { completeMfa, createSession, destroySession, getPendingUserId, requireUser, type Role } from "@/lib/server/auth.ts";
import { contactSchema, saveSiteContact } from "@/lib/server/site-settings.ts";
import { CLIENT_STATUSES, CURRENCIES, DEAL_STAGES, INVOICE_STATUSES, LEAD_STATUSES, nextInvoiceNumber } from "@/lib/server/admin-data.ts";

/*
 * Every action: authenticates (requireUser with the minimum role), validates input with zod,
 * writes inside the database, records an audit entry. Server Actions also carry Next.js's
 * built-in CSRF protection (POST-only, Origin must match Host).
 */

export type FormState = { error?: string; ok?: string } | undefined;

const ip = async () => clientIp(await headers());
const id = z.coerce.number().int().positive();
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const fd = (f: FormData) => Object.fromEntries([...f.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;

/* ───────── Authentication ───────── */

const GENERIC = "Email or password is incorrect.";

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const addr = await ip();
  const email = String(form.get("email") || "").normalize("NFKC").trim().toLowerCase().slice(0, 200);
  const password = String(form.get("password") || "").slice(0, 200);
  if (rateLimited(`login-ip:${addr}`, 10, 15 * 60_000) || rateLimited(`login-email:${email}`, 5, 15 * 60_000)) {
    // Record a lockout once per account per 15 minutes, so a flood can't bloat the audit log.
    if (!rateLimited(`audit-lock:${email}`, 1, 15 * 60_000)) audit("auth.locked", { meta: { email }, ip: addr });
    return { error: "Too many attempts. Wait 15 minutes and try again." };
  }
  const user = get<{ id: number; password_hash: string; totp_enabled: number; disabled: number }>(
    "SELECT id, password_hash, totp_enabled, disabled FROM users WHERE email = ?",
    email,
  );
  // Verify against a dummy hash when the user doesn't exist, so timing doesn't reveal accounts.
  const ok = await verifyPassword(password, user?.password_hash ?? "scrypt$131072$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==");
  if (!user || !ok || user.disabled) {
    audit("auth.failed", { meta: { email }, ip: addr });
    return { error: GENERIC };
  }
  await createSession(user.id, Boolean(user.totp_enabled));
  if (user.totp_enabled) redirect("/admin/login/verify");
  run("UPDATE users SET last_login_at = ? WHERE id = ?", Date.now(), user.id);
  audit("auth.login", { userId: user.id, ip: addr });
  redirect("/admin");
}

export async function verifySecondFactor(_: FormState, form: FormData): Promise<FormState> {
  const addr = await ip();
  const uid = await getPendingUserId();
  if (!uid) redirect("/admin/login");
  if (rateLimited(`mfa:${uid}`, 6, 15 * 60_000)) return { error: "Too many attempts. Sign in again in 15 minutes." };
  const u = get<{ totp_secret: string | null; totp_last_step: number }>("SELECT totp_secret, totp_last_step FROM users WHERE id = ?", uid);
  const step = u?.totp_secret ? verifyTotp(u.totp_secret, String(form.get("code") || ""), u.totp_last_step) : 0;
  if (!step) {
    audit("auth.mfa_failed", { userId: uid, ip: addr });
    return { error: "That code didn't match. Use the current code from your authenticator app." };
  }
  run("UPDATE users SET totp_last_step = ? WHERE id = ?", step, uid);
  await completeMfa();
  run("UPDATE users SET last_login_at = ? WHERE id = ?", Date.now(), uid);
  audit("auth.login", { userId: uid, ip: addr, meta: { mfa: true } });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/** First run only: no users yet, and the one-time token from storage/setup-token.txt. */
export async function setupOwner(_: FormState, form: FormData): Promise<FormState> {
  const addr = await ip();
  if (rateLimited(`setup:${addr}`, 5, 15 * 60_000)) return { error: "Too many attempts. Try again later." };
  const count = get<{ n: number }>("SELECT COUNT(*) AS n FROM users")!.n;
  if (count > 0) redirect("/admin/login");
  const file = path.join(dataDir(), "setup-token.txt");
  const token = existsSync(file) ? readFileSync(file, "utf8").trim() : "";
  const given = String(form.get("token") || "").trim();
  if (!token || !safeEqual(token, given)) return { error: "The setup token is not correct." };
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), email: z.email().max(200), password: z.string().max(200) })
    .safeParse({ name: form.get("name"), email: String(form.get("email") || "").trim().toLowerCase(), password: form.get("password") });
  if (!parsed.success) return { error: "Check the name and email." };
  const problem = passwordProblem(parsed.data.password, parsed.data.email);
  if (problem) return { error: problem };
  const hash = await hashPassword(parsed.data.password);
  const res = run(
    "INSERT INTO users (email, name, role, password_hash, created_at) VALUES (?, ?, 'owner', ?, ?)",
    parsed.data.email,
    parsed.data.name,
    hash,
    Date.now(),
  );
  rmSync(file, { force: true });
  audit("user.setup_owner", { userId: Number(res.lastInsertRowid), ip: addr });
  await createSession(Number(res.lastInsertRowid), false);
  redirect("/admin/settings?welcome=1");
}

/* ───────── Leads ───────── */

export async function setLeadStatus(form: FormData) {
  const u = await requireUser("manager");
  const v = z.object({ id, status: z.enum(LEAD_STATUSES) }).parse(fd(form));
  run("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?", v.status, Date.now(), v.id);
  audit("lead.status", { userId: u.id, entity: "lead", entityId: v.id, meta: { status: v.status } });
  revalidatePath("/admin", "layout");
}

export async function convertLead(form: FormData) {
  const u = await requireUser("manager");
  const { id: leadId } = z.object({ id }).parse(fd(form));
  const l = get<{ name: string; email: string; contact: string | null; company: string | null; locale: string | null; service_id: string | null; challenge: string | null; client_id: number | null }>(
    "SELECT name, email, contact, company, locale, service_id, challenge, client_id FROM leads WHERE id = ?",
    leadId,
  );
  if (!l) return;
  if (l.client_id) redirect(`/admin/clients/${l.client_id}`);
  const clientId = tx(() => {
    const now = Date.now();
    const existing = get<{ id: number }>("SELECT id FROM clients WHERE email = ? COLLATE NOCASE", l.email);
    const cid =
      existing?.id ??
      Number(
        run(
          "INSERT INTO clients (created_at, updated_at, name, company, email, phone, language, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'website brief', 'prospect')",
          now,
          now,
          l.name,
          l.company,
          l.email,
          l.contact,
          l.locale,
        ).lastInsertRowid,
      );
    run("UPDATE leads SET status = 'converted', client_id = ?, updated_at = ? WHERE id = ?", cid, now, leadId);
    run(
      "INSERT INTO deals (created_at, updated_at, client_id, title, service_id, stage, notes) VALUES (?, ?, ?, ?, ?, 'discovery', ?)",
      now,
      now,
      cid,
      l.company ? `${l.company} — new project` : `${l.name} — new project`,
      l.service_id,
      l.challenge,
    );
    run("INSERT INTO activities (ts, client_id, lead_id, user_id, kind, body) VALUES (?, ?, ?, ?, 'system', ?)", now, cid, leadId, u.id, "Created from a website brief.");
    return cid;
  });
  audit("lead.convert", { userId: u.id, entity: "lead", entityId: leadId, meta: { clientId } });
  revalidatePath("/admin", "layout");
  redirect(`/admin/clients/${clientId}`);
}

export async function deleteLead(form: FormData) {
  const u = await requireUser("admin");
  const { id: leadId } = z.object({ id }).parse(fd(form));
  run("DELETE FROM leads WHERE id = ?", leadId);
  audit("lead.delete", { userId: u.id, entity: "lead", entityId: leadId });
  revalidatePath("/admin", "layout");
  redirect("/admin/leads");
}

/* ───────── Clients ───────── */

const clientFields = z.object({
  name: z.string().trim().min(1).max(120),
  company: opt(160),
  email: z.union([z.email().max(200), z.literal("")]).optional().transform((v) => v || null),
  phone: opt(60),
  telegram: opt(60),
  country: opt(60),
  language: opt(20),
  source: opt(80),
  status: z.enum(CLIENT_STATUSES).default("prospect"),
  tags: opt(200),
  notes: opt(5000),
});

export async function saveClient(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("manager");
  const raw = fd(form);
  const parsed = clientFields.safeParse(raw);
  if (!parsed.success) return { error: "Check the highlighted fields — a name is required and the email must be valid." };
  const v = parsed.data;
  const now = Date.now();
  let cid = raw.id ? Number(raw.id) : 0;
  if (cid) {
    run(
      "UPDATE clients SET name=?, company=?, email=?, phone=?, telegram=?, country=?, language=?, source=?, status=?, tags=?, notes=?, updated_at=? WHERE id=?",
      v.name, v.company ?? null, v.email, v.phone ?? null, v.telegram ?? null, v.country ?? null, v.language ?? null, v.source ?? null, v.status, v.tags ?? null, v.notes ?? null, now, cid,
    );
    audit("client.update", { userId: u.id, entity: "client", entityId: cid });
  } else {
    cid = Number(
      run(
        "INSERT INTO clients (created_at, updated_at, name, company, email, phone, telegram, country, language, source, status, tags, notes, owner_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        now, now, v.name, v.company ?? null, v.email, v.phone ?? null, v.telegram ?? null, v.country ?? null, v.language ?? null, v.source ?? null, v.status, v.tags ?? null, v.notes ?? null, u.id,
      ).lastInsertRowid,
    );
    audit("client.create", { userId: u.id, entity: "client", entityId: cid });
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/clients/${cid}`);
}

export async function deleteClient(form: FormData) {
  const u = await requireUser("admin");
  const { id: cid } = z.object({ id }).parse(fd(form));
  run("DELETE FROM clients WHERE id = ?", cid);
  audit("client.delete", { userId: u.id, entity: "client", entityId: cid });
  revalidatePath("/admin", "layout");
  redirect("/admin/clients");
}

export async function addActivity(form: FormData) {
  const u = await requireUser("manager");
  const v = z
    .object({ clientId: z.coerce.number().int().optional(), leadId: z.coerce.number().int().optional(), kind: z.enum(["note", "call", "email", "meeting", "message"]), body: z.string().trim().min(1).max(5000) })
    .parse(fd(form));
  run("INSERT INTO activities (ts, client_id, lead_id, user_id, kind, body) VALUES (?, ?, ?, ?, ?, ?)", Date.now(), v.clientId || null, v.leadId || null, u.id, v.kind, v.body);
  if (v.clientId) run("UPDATE clients SET updated_at = ? WHERE id = ?", Date.now(), v.clientId);
  audit("activity.add", { userId: u.id, entity: v.clientId ? "client" : "lead", entityId: v.clientId || v.leadId });
  revalidatePath("/admin", "layout");
}

/* ───────── Deals ───────── */

export async function saveDeal(form: FormData) {
  const u = await requireUser("manager");
  const raw = fd(form);
  const v = z
    .object({
      clientId: id,
      title: z.string().trim().min(1).max(160),
      serviceId: opt(60),
      value: z.coerce.number().min(0).max(10_000_000),
      recurring: z.string().optional(),
      stage: z.enum(DEAL_STAGES),
      expectedClose: z.union([dateStr, z.literal("")]).optional(),
      notes: opt(3000),
    })
    .parse(raw);
  const now = Date.now();
  if (raw.id) {
    run(
      "UPDATE deals SET title=?, service_id=?, value_usd=?, recurring=?, stage=?, expected_close=?, notes=?, updated_at=?, closed_at=CASE WHEN ? IN ('won','lost') THEN COALESCE(closed_at, ?) ELSE NULL END WHERE id=?",
      v.title, v.serviceId ?? null, v.value, v.recurring ? 1 : 0, v.stage, v.expectedClose || null, v.notes ?? null, now, v.stage, now, Number(raw.id),
    );
    audit("deal.update", { userId: u.id, entity: "deal", entityId: raw.id });
  } else {
    const r = run(
      "INSERT INTO deals (created_at, updated_at, client_id, title, service_id, value_usd, recurring, stage, expected_close, notes) VALUES (?,?,?,?,?,?,?,?,?,?)",
      now, now, v.clientId, v.title, v.serviceId ?? null, v.value, v.recurring ? 1 : 0, v.stage, v.expectedClose || null, v.notes ?? null,
    );
    audit("deal.create", { userId: u.id, entity: "deal", entityId: Number(r.lastInsertRowid) });
  }
  run("UPDATE clients SET updated_at = ?, status = CASE WHEN ? = 'won' THEN 'active' ELSE status END WHERE id = ?", now, v.stage, v.clientId);
  revalidatePath("/admin", "layout");
}

export async function moveDeal(form: FormData) {
  const u = await requireUser("manager");
  const v = z.object({ id, stage: z.enum(DEAL_STAGES) }).parse(fd(form));
  const now = Date.now();
  run(
    "UPDATE deals SET stage = ?, updated_at = ?, closed_at = CASE WHEN ? IN ('won','lost') THEN ? ELSE NULL END WHERE id = ?",
    v.stage, now, v.stage, now, v.id,
  );
  if (v.stage === "won") run("UPDATE clients SET status = 'active', updated_at = ? WHERE id = (SELECT client_id FROM deals WHERE id = ?)", now, v.id);
  audit("deal.stage", { userId: u.id, entity: "deal", entityId: v.id, meta: { stage: v.stage } });
  revalidatePath("/admin", "layout");
}

export async function deleteDeal(form: FormData) {
  const u = await requireUser("admin");
  const { id: did } = z.object({ id }).parse(fd(form));
  run("DELETE FROM deals WHERE id = ?", did);
  audit("deal.delete", { userId: u.id, entity: "deal", entityId: did });
  revalidatePath("/admin", "layout");
}

/* ───────── Invoices, payments, expenses ───────── */

export async function createInvoice(form: FormData) {
  const u = await requireUser("manager");
  const v = z
    .object({
      clientId: id,
      dealId: z.coerce.number().int().optional(),
      issueDate: dateStr,
      dueDate: dateStr,
      currency: z.enum(CURRENCIES),
      amount: z.coerce.number().positive().max(100_000_000),
      description: opt(1000),
      status: z.enum(INVOICE_STATUSES).default("draft"),
    })
    .parse(fd(form));
  const number = nextInvoiceNumber();
  const r = run(
    "INSERT INTO invoices (created_at, number, client_id, deal_id, issue_date, due_date, currency, amount, status, description) VALUES (?,?,?,?,?,?,?,?,?,?)",
    Date.now(), number, v.clientId, v.dealId || null, v.issueDate, v.dueDate, v.currency, v.amount, v.status, v.description ?? null,
  );
  audit("invoice.create", { userId: u.id, entity: "invoice", entityId: Number(r.lastInsertRowid), meta: { number } });
  revalidatePath("/admin", "layout");
}

export async function setInvoiceStatus(form: FormData) {
  const u = await requireUser("manager");
  const v = z.object({ id, status: z.enum(INVOICE_STATUSES) }).parse(fd(form));
  run("UPDATE invoices SET status = ? WHERE id = ?", v.status, v.id);
  audit("invoice.status", { userId: u.id, entity: "invoice", entityId: v.id, meta: { status: v.status } });
  revalidatePath("/admin", "layout");
}

export async function addPayment(form: FormData) {
  const u = await requireUser("manager");
  const v = z.object({ invoiceId: id, date: dateStr, amount: z.coerce.number().positive().max(100_000_000), method: opt(60), note: opt(300) }).parse(fd(form));
  tx(() => {
    run("INSERT INTO payments (created_at, invoice_id, date, amount, method, note) VALUES (?,?,?,?,?,?)", Date.now(), v.invoiceId, v.date, v.amount, v.method ?? null, v.note ?? null);
    const inv = get<{ amount: number; paid: number }>("SELECT amount, (SELECT COALESCE(SUM(amount),0) FROM payments WHERE invoice_id = ?) AS paid FROM invoices WHERE id = ?", v.invoiceId, v.invoiceId);
    if (inv) run("UPDATE invoices SET status = ? WHERE id = ?", inv.paid + 0.0001 >= inv.amount ? "paid" : "partial", v.invoiceId);
  });
  audit("payment.add", { userId: u.id, entity: "invoice", entityId: v.invoiceId, meta: { amount: v.amount } });
  revalidatePath("/admin", "layout");
}

export async function deleteInvoice(form: FormData) {
  const u = await requireUser("admin");
  const { id: iid } = z.object({ id }).parse(fd(form));
  run("DELETE FROM invoices WHERE id = ?", iid);
  audit("invoice.delete", { userId: u.id, entity: "invoice", entityId: iid });
  revalidatePath("/admin", "layout");
}

export async function addExpense(form: FormData) {
  const u = await requireUser("manager");
  const v = z.object({ date: dateStr, category: z.string().trim().min(1).max(60), currency: z.enum(CURRENCIES), amount: z.coerce.number().positive().max(100_000_000), note: opt(300) }).parse(fd(form));
  const r = run("INSERT INTO expenses (created_at, date, category, currency, amount, note) VALUES (?,?,?,?,?,?)", Date.now(), v.date, v.category, v.currency, v.amount, v.note ?? null);
  audit("expense.add", { userId: u.id, entity: "expense", entityId: Number(r.lastInsertRowid) });
  revalidatePath("/admin", "layout");
}

export async function deleteExpense(form: FormData) {
  const u = await requireUser("admin");
  const { id: eid } = z.object({ id }).parse(fd(form));
  run("DELETE FROM expenses WHERE id = ?", eid);
  audit("expense.delete", { userId: u.id, entity: "expense", entityId: eid });
  revalidatePath("/admin", "layout");
}

/* ───────── Tasks ───────── */

export async function createTask(form: FormData) {
  const u = await requireUser("manager");
  const v = z
    .object({
      title: z.string().trim().min(1).max(200),
      dueDate: z.union([dateStr, z.literal("")]).optional(),
      priority: z.enum(["low", "normal", "high"]).default("normal"),
      clientId: z.coerce.number().int().optional(),
      leadId: z.coerce.number().int().optional(),
    })
    .parse(fd(form));
  const r = run(
    "INSERT INTO tasks (created_at, title, due_date, priority, client_id, lead_id, assignee_id) VALUES (?,?,?,?,?,?,?)",
    Date.now(), v.title, v.dueDate || null, v.priority, v.clientId || null, v.leadId || null, u.id,
  );
  audit("task.create", { userId: u.id, entity: "task", entityId: Number(r.lastInsertRowid) });
  revalidatePath("/admin", "layout");
}

export async function toggleTask(form: FormData) {
  const u = await requireUser("manager");
  const { id: tid } = z.object({ id }).parse(fd(form));
  run("UPDATE tasks SET done = 1 - done, done_at = CASE WHEN done = 0 THEN ? ELSE NULL END WHERE id = ?", Date.now(), tid);
  audit("task.toggle", { userId: u.id, entity: "task", entityId: tid });
  revalidatePath("/admin", "layout");
}

export async function deleteTask(form: FormData) {
  const u = await requireUser("manager");
  const { id: tid } = z.object({ id }).parse(fd(form));
  run("DELETE FROM tasks WHERE id = ?", tid);
  audit("task.delete", { userId: u.id, entity: "task", entityId: tid });
  revalidatePath("/admin", "layout");
}

/* ───────── Account & security ───────── */

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("viewer", { allowTemporary: true });
  const row = get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", u.id)!;
  if (rateLimited(`pw:${u.id}`, 5, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  if (!(await verifyPassword(String(form.get("current") || ""), row.password_hash))) {
    audit("user.password_failed", { userId: u.id, ip: await ip() });
    return { error: "Your current password is not correct." };
  }
  const next = String(form.get("next") || "");
  if (next !== String(form.get("confirm") || "")) return { error: "The new passwords don't match." };
  const problem = passwordProblem(next, u.email);
  if (problem) return { error: problem };
  if (await verifyPassword(next, row.password_hash)) return { error: "Choose a new password that differs from the current one." };
  run("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?", await hashPassword(next), u.id);
  // Sign out every other session.
  run("DELETE FROM sessions WHERE user_id = ?", u.id);
  await createSession(u.id, false);
  audit("user.password", { userId: u.id, ip: await ip() });
  if (u.must_change_password) redirect("/admin/settings?password=1");
  return { ok: "Password changed. Other sessions were signed out." };
}

export async function startTotp() {
  const u = await requireUser("viewer");
  if (u.totp_enabled) return;
  run("UPDATE users SET totp_secret = ? WHERE id = ? AND totp_enabled = 0", newTotpSecret(), u.id);
  revalidatePath("/admin/settings");
}

export async function enableTotp(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("viewer");
  if (rateLimited(`totp-enable:${u.id}`, 6, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  const row = get<{ totp_secret: string | null }>("SELECT totp_secret FROM users WHERE id = ?", u.id);
  if (!row?.totp_secret) return { error: "Start the setup first." };
  const step = verifyTotp(row.totp_secret, String(form.get("code") || ""));
  if (!step) return { error: "That code didn't match. Check the time on your phone and try again." };
  run("UPDATE users SET totp_enabled = 1, totp_last_step = ? WHERE id = ?", step, u.id);
  audit("user.mfa_enabled", { userId: u.id, ip: await ip() });
  revalidatePath("/admin/settings");
  return { ok: "Two-step sign-in is on." };
}

export async function disableTotp(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("viewer");
  if (rateLimited(`totp-disable:${u.id}`, 5, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  const row = get<{ password_hash: string; totp_secret: string | null; totp_last_step: number }>("SELECT password_hash, totp_secret, totp_last_step FROM users WHERE id = ?", u.id)!;
  // Turning protection off needs both factors: the password and a current code.
  const passOk = await verifyPassword(String(form.get("password") || ""), row.password_hash);
  const step = row.totp_secret ? verifyTotp(row.totp_secret, String(form.get("code") || ""), row.totp_last_step) : 0;
  if (!passOk || !step) {
    audit("user.mfa_disable_failed", { userId: u.id, ip: await ip() });
    return { error: "The password or the code is not correct." };
  }
  run("UPDATE users SET totp_enabled = 0, totp_secret = NULL, totp_last_step = 0 WHERE id = ?", u.id);
  audit("user.mfa_disabled", { userId: u.id, ip: await ip() });
  revalidatePath("/admin/settings");
  return { ok: "Two-step sign-in is off." };
}

export async function signOutEverywhere() {
  const u = await requireUser("viewer");
  run("DELETE FROM sessions WHERE user_id = ?", u.id);
  audit("user.signout_all", { userId: u.id });
  redirect("/admin/login");
}

export async function createUser(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("admin");
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), email: z.email().max(200), role: z.enum(["admin", "manager", "viewer"]), password: z.string().max(200) })
    .safeParse({ name: form.get("name"), email: String(form.get("email") || "").trim().toLowerCase(), role: form.get("role"), password: form.get("password") });
  if (!parsed.success) return { error: "Check the name, email and role." };
  if (parsed.data.role === "admin" && u.role !== "owner") return { error: "Only the owner can add admins." };
  const problem = passwordProblem(parsed.data.password, parsed.data.email);
  if (problem) return { error: problem };
  if (get("SELECT id FROM users WHERE email = ?", parsed.data.email)) return { error: "A user with this email already exists." };
  const r = run(
    // Someone else chose this password, so the new user must replace it at first sign-in.
    "INSERT INTO users (email, name, role, password_hash, created_at, must_change_password) VALUES (?,?,?,?,?,1)",
    parsed.data.email, parsed.data.name, parsed.data.role, await hashPassword(parsed.data.password), Date.now(),
  );
  audit("user.create", { userId: u.id, entity: "user", entityId: Number(r.lastInsertRowid), meta: { role: parsed.data.role } });
  revalidatePath("/admin/settings");
  return { ok: `${parsed.data.name} can now sign in. Ask them to turn on two-step sign-in.` };
}

export async function toggleUser(form: FormData) {
  const u = await requireUser("admin");
  const { id: uid } = z.object({ id }).parse(fd(form));
  const target = get<{ role: Role }>("SELECT role FROM users WHERE id = ?", uid);
  // Nobody can switch off themselves or the owner; only the owner can switch off an admin.
  if (!target || uid === u.id || target.role === "owner" || (target.role === "admin" && u.role !== "owner")) return;
  run("UPDATE users SET disabled = 1 - disabled WHERE id = ?", uid);
  run("DELETE FROM sessions WHERE user_id = ?", uid);
  audit("user.toggle", { userId: u.id, entity: "user", entityId: uid });
  revalidatePath("/admin/settings");
}

/* ───────── Website settings ───────── */

export async function saveContactSettings(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("admin");
  const raw = fd(form);
  const social = [0, 1, 2, 3, 4]
    .map((i) => ({ label: (raw[`socialLabel${i}`] || "").trim(), url: (raw[`socialUrl${i}`] || "").trim() }))
    .filter((s) => s.label && s.url);
  const parsed = contactSchema.safeParse({
    salesEmail: (raw.salesEmail || "").trim(),
    telegram: (raw.telegram || "").trim().replace(/^@/, ""),
    whatsapp: (raw.whatsapp || "").trim(),
    phone: (raw.phone || "").trim(),
    securityEmail: (raw.securityEmail || "").trim(),
    social,
  });
  if (!parsed.success) return { error: "Check the values: emails must be valid, Telegram is a username, links must start with https://." };
  saveSiteContact(parsed.data);
  audit("settings.contact", { userId: u.id });
  revalidatePath("/", "layout");
  return { ok: "Saved. The website shows the new details now." };
}

export async function saveFxRates(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("admin");
  const parsed = z.object({ AMD: z.coerce.number().positive().max(10_000), EUR: z.coerce.number().positive().max(10), RUB: z.coerce.number().positive().max(1_000) }).safeParse(fd(form));
  if (!parsed.success) return { error: "Enter positive numbers." };
  const value = JSON.stringify({ AMD: 1 / parsed.data.AMD, EUR: parsed.data.EUR, RUB: 1 / parsed.data.RUB });
  run("INSERT INTO settings (key, value, updated_at) VALUES ('finance.fx', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at", value, Date.now());
  audit("settings.fx", { userId: u.id, meta: parsed.data });
  revalidatePath("/admin", "layout");
  return { ok: "Exchange rates saved." };
}

export async function purgeAnalytics(form: FormData) {
  const u = await requireUser("owner");
  const { days } = z.object({ days: z.coerce.number().int().min(30).max(3650) }).parse(fd(form));
  const before = Date.now() - days * 86400_000;
  run("DELETE FROM pageviews WHERE ts < ?", before);
  run("DELETE FROM events WHERE ts < ?", before);
  audit("analytics.purge", { userId: u.id, meta: { days } });
  revalidatePath("/admin", "layout");
}

/** Used by the dashboard's quick counters. */
export async function ping() {
  await requireUser("viewer");
  return all<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE status = 'new'")[0]?.n ?? 0;
}
