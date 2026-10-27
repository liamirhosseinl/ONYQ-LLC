import { getSiteContact } from "@/lib/server/site-settings.ts";
import { siteConfig } from "@/data/site-config.ts";

export const dynamic = "force-dynamic";

/** RFC 9116 security.txt — published once a security contact is set in Admin → Settings. */
export function GET() {
  const { securityEmail } = getSiteContact();
  if (!securityEmail) return new Response("Not found", { status: 404 });
  const expires = new Date(Date.now() + 180 * 86400_000).toISOString();
  const body = [
    `Contact: mailto:${securityEmail}`,
    `Expires: ${expires}`,
    "Preferred-Languages: en, ru, hy",
    `Canonical: ${siteConfig.url}/.well-known/security.txt`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
