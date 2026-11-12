import { NextResponse } from "next/server";
import { can, getUser } from "@/lib/server/auth.ts";
import { PREVIEW_COOKIE } from "@/lib/server/content.ts";

export const dynamic = "force-dynamic";

/**
 * GET /admin/preview?mode=on|off&next=/ru/price
 * Turns draft preview on or off for the signed-in editor and returns to a page of the site.
 * Only the editor's own view changes; visitors always get the published content.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/";
  const target = /^\/(?![/\\])[A-Za-z0-9\-._~%/]*$/.test(next) ? next : "/";
  const user = await getUser();
  if (!user || !can(user, "manager")) return NextResponse.redirect(new URL("/admin/login", url.origin), 303);
  const res = NextResponse.redirect(new URL(target, url.origin), 303);
  if (url.searchParams.get("mode") === "off") {
    res.cookies.delete(PREVIEW_COOKIE);
  } else {
    res.cookies.set(PREVIEW_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
  }
  res.headers.set("Cache-Control", "no-store");
  return res;
}
