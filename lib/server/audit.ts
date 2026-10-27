import "server-only";
import { run } from "./db.ts";

/** Append-only audit trail: sign-ins, failures, every change made in the admin panel. */
export function audit(action: string, opts: { userId?: number | null; entity?: string; entityId?: string | number; meta?: unknown; ip?: string } = {}) {
  try {
    run(
      "INSERT INTO audit_log (ts, user_id, action, entity, entity_id, meta, ip) VALUES (?, ?, ?, ?, ?, ?, ?)",
      Date.now(),
      opts.userId ?? null,
      action,
      opts.entity ?? null,
      opts.entityId !== undefined ? String(opts.entityId) : null,
      opts.meta !== undefined ? JSON.stringify(opts.meta).slice(0, 2000) : null,
      opts.ip ?? null,
    );
  } catch {
    // Auditing must never break the action itself.
  }
}
