import "server-only";

/**
 * Invitation codes look like "<business name>/<suffix>", e.g. "onyq/963". The suffix is a
 * shared secret that managers give out in person; it is read from ONYQ_VIP_SUFFIX (default
 * "963") and is only ever compared here, on the server.
 */
export function vipSuffix(): string {
  return (process.env.ONYQ_VIP_SUFFIX || "963").trim();
}

/** Returns the business name for a valid code, or null. */
export function parseVipCode(code: string): { business: string } | null {
  const value = code.normalize("NFKC").trim();
  const suffix = `/${vipSuffix()}`;
  if (!value.toLowerCase().endsWith(suffix.toLowerCase())) return null;
  const business = value
    .slice(0, value.length - suffix.length)
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (business.length < 2 || business.length > 80) return null;
  return { business };
}
