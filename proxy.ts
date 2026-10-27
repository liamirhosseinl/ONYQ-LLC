import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing.ts";

const intl = createMiddleware(routing);

/**
 * Every page response gets a strict, nonce-based Content-Security-Policy (CSP Level 3 with
 * 'strict-dynamic'): only scripts carrying this request's nonce — Next.js's own and our inline
 * bootstrap — can run. Inline style attributes stay allowed (React style props, GSAP).
 * The static security headers live in next.config.ts.
 */
function csp(nonce: string, dev: boolean) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self'",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/**
 * Admin writes (Server Actions are POSTs) must come from a page of this very site. Browsers always
 * send Origin on POST; a request without it, or from another site, is refused before it reaches
 * any action. (Next.js checks this too, but lets a missing Origin through.)
 */
function foreignAdminPost(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") return false;
  const origin = request.headers.get("origin");
  const host = (process.env.ONYQ_TRUST_PROXY === "1" && request.headers.get("x-forwarded-host")) || request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") && foreignAdminPost(request)) {
    return new NextResponse("Forbidden", { status: 403, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
  // 128 bits of randomness per response (CSP3 recommends at least 128).
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(18))).toString("base64");
  const policy = csp(nonce, process.env.NODE_ENV === "development");
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");

  // Next.js reads the nonce from the request's CSP header and stamps it on its own scripts.
  request.headers.set("x-nonce", nonce);
  request.headers.set("content-security-policy", policy);

  const response = isAdmin ? NextResponse.next({ request: { headers: request.headers } }) : intl(request);
  response.headers.set("Content-Security-Policy", policy);
  if (isAdmin) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}

export const config = {
  // Skip API routes, Next internals and files with an extension (icons, fonts, robots.txt…).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
