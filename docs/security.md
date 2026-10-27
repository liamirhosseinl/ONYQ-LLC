# Security

This file describes how the ONYQ site and its admin panel are protected, which standards the controls follow, and what the person running the server still has to do.

The controls are mapped to **OWASP ASVS 4.0.3** (Level 2 target), the **OWASP Secure Headers Project**, **NIST SP 800-63B** (passwords and MFA) and **RFC 9116** (security.txt). GDPR principles shape the analytics design (data minimisation, no personal identifiers, no cookies).

> No software can honestly be called "impenetrable". The aim is defence in depth. Each layer below assumes the one before it can fail. The server, TLS, backups and updates (see `docs/deployment.md`) matter as much as the code.

## 1. Transport and browser hardening

Headers are set in `next.config.ts` (static) and `proxy.ts` (per request).

| Control | Value | Why |
|---|---|---|
| HSTS | `max-age=63072000; includeSubDomains; preload` | HTTPS only, eligible for the browser preload list |
| Content-Security-Policy | nonce per request + `'strict-dynamic'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests` | Blocks injected scripts (XSS), clickjacking and form hijacking. No `unsafe-eval` in production. No third-party origins at all. |
| X-Frame-Options | `DENY` | Clickjacking (older browsers) |
| X-Content-Type-Options | `nosniff` | MIME confusion |
| Referrer-Policy | `strict-origin-when-cross-origin` (admin: `no-referrer`) | No URL leakage |
| Cross-Origin-Opener/Resource-Policy | `same-origin` | Cross-window and Spectre-class isolation |
| Permissions-Policy | camera, microphone, geolocation, payment, USB, etc. all disabled | Least privilege |
| `X-Powered-By` | removed | No stack fingerprinting |
| Cache-Control on `/api/*` and `/admin/*` | `no-store` | Nothing private in caches |
| `X-Robots-Tag` on `/admin` and `/api` | `noindex, nofollow` | The panel never appears in search |

The site loads **no external scripts, fonts, trackers or CDNs**: fonts and artwork are self-hosted. So the CSP can stay strict, and visitors' data goes nowhere else.

## 2. Public endpoints

| Endpoint | Protection |
|---|---|
| `POST /api/enquiry` (brief form) | Same-origin check (403 otherwise), 16 KB body cap, strict zod schema, honeypot field, rate limits (5 per 10 min and 20 per day per IP, stored in the database so they survive restarts), audit entry. Data is stored first, then optionally forwarded. |
| `POST /api/a` (analytics beacon) | Same-origin, 4 KB cap, strict schema, 240 per 10 min per IP, bots and automated browsers ignored, always answers `204` (reveals nothing). |
| `/.well-known/security.txt` | RFC 9116. Published once a security contact is set in Admin → Settings. |

All SQL uses prepared statements with bound parameters. There is no string-built SQL anywhere, which rules out SQL injection. React escapes all output. `dangerouslySetInnerHTML` is never used with visitor input. Its only uses are the nonce-tagged bootstrap scripts, JSON-LD built from our own content (with `<` escaped), static code samples, and the 2FA QR code SVG generated on the server.

## 3. Admin authentication (ASVS V2, V3; NIST 800-63B)

- **First run:**
  - With no users, `/admin/setup` asks for a one-time **setup token**. The token is written to `storage/setup-token.txt` (mode 600) and printed to the server log.
  - Only someone with server access can create the owner. After that, setup is closed for good.
- **Passwords:**
  - At least 12 characters.
  - Hashed with **scrypt** (N=2¹⁷, r=8, p=1, 16-byte salt) and compared in constant time.
  - Changing the password signs out every other session.
- **Two-factor (TOTP, RFC 6238):** any authenticator app works (Google Authenticator, 1Password, Authy…). Strongly recommended for every account, and required in practice for the owner.
- **Brute-force protection:**
  - Login is limited to 10 tries per IP and 5 per email every 15 minutes, and so is the 2FA step.
  - Errors are generic ("email or password is incorrect").
  - A dummy hash runs when the email doesn't exist, so response timing reveals nothing.
- **Sessions:**
  - 256-bit random token. Only its SHA-256 is stored in the database.
  - Cookie `__Host-onyq_admin`: `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, no domain.
  - Idle timeout 2 hours; absolute lifetime 12 hours.
  - The token rotates after the second factor.
  - "Sign out everywhere" is available.
- **CSRF:** every change goes through a Next.js Server Action. These are POST-only and bound to the site's origin. Cookies are `SameSite=Strict`.
- **Roles (least privilege):**

  | Role | Can |
  |---|---|
  | `viewer` | read |
  | `manager` | + edit clients, deals, invoices, tasks; export CSV |
  | `admin` | + delete records, change site contacts, FX rates, analytics retention |
  | `owner` | + manage team accounts |

  Every action re-checks the role on the server.

## 4. Data protection

- **Database:**
  - One SQLite file (`storage/onyq.db`, mode 600) outside the web root, never served.
  - WAL journaling; append-only migrations.
- **Audit log:** sign-ins, failures, every create/update/delete and every export is recorded with user, time and IP (Admin → Audit log).
- **CSV exports:**
  - Managers and above only.
  - Audited.
  - Cells are neutralised against spreadsheet formula injection (OWASP CSV injection).
- **Analytics are privacy-first** (no consent banner needed under GDPR/ePrivacy in most readings; confirm with your counsel):
  - no cookies, no localStorage identifiers, no fingerprinting;
  - a visitor is a one-way hash of (daily random salt + IP + user agent). Salts are deleted after 2 days, so visitors cannot be followed across days and IPs are never stored;
  - "Do not track" signals (Global Privacy Control) are respected; bots are filtered;
  - raw page views can be purged by age from Settings.
- Client and finance data is only reachable after sign-in and is never sent to third parties.

## 5. Supply chain

- Pinned dependency versions. `npm audit` reports **0 vulnerabilities** at delivery. The runtime has few dependencies (Next, React, next-intl, GSAP, Lenis, zod, qrcode).
- The database uses Node's built-in `node:sqlite`, so no native module needs compiling.
- Run `npm audit` and update Next.js monthly (see deployment).

## 6. What the operator must do

These are outside the code and are required for the guarantees above:

1. Serve **only over HTTPS** behind a reverse proxy (Caddy or nginx) that **overwrites** `X-Forwarded-For` / `X-Real-IP`. Otherwise rate limits can be bypassed by spoofing headers.
2. Keep `storage/` on a persistent, **private** volume and **back it up daily** (encrypted, off-site). Test a restore.
3. Enable 2FA on every admin account, and remove accounts that are no longer used.
4. Keep the OS, Node.js (22 LTS or newer) and the site's dependencies updated.
5. Set a security contact in Admin → Settings so `security.txt` is published.
6. Optional but recommended: put Cloudflare (or similar) in front for DDoS protection and a WAF. If you do, set `ONYQ_TRUST_CLOUDFLARE=1` so the real visitor IP is read from `CF-Connecting-IP`, and firewall the server so only Cloudflare can reach it. Without that variable the header is ignored, so it cannot be forged.

## 7. Verification

- `tests/e2e/security.spec.ts` checks:
  - the headers and the CSP nonce;
  - that admin is noindex and no-store, and redirects to sign-in;
  - that exports return 404 to anonymous users;
  - that the beacon never errors.
- `tests/e2e/interactions.spec.ts` checks:
  - that cross-site posts to the brief endpoint get 403 and invalid ones get 400;
  - that a real brief is stored.
- External checks recommended after go-live:
  - securityheaders.com (expected grade **A+**);
  - SSL Labs (expected **A+** with a modern TLS config);
  - Mozilla Observatory.

## 8. Penetration test — 27 Oct 2026 (v4.1)

A white-box code review and a black-box attack run (125 checks) against a production build.

**Fixed in v4.1:**

| # | Finding | Severity | Fix |
|---|---|---|---|
| 1 | Next.js 16.3.8 affected by newly published advisories (remote code execution via the image optimiser with SVG; `use cache` typed arrays; Server Actions DoS). zod < 4.6.6 memory exhaustion. | Critical | Upgraded to Next.js 16.4.3 and zod 4.6.7; `npm audit`: 0. Image optimiser locked to `/work/**`, no SVG, no remote hosts, one quality. |
| 2 | Rate limits trusted `X-Forwarded-For` / `X-Real-IP` from anyone, so direct requests could fake a new IP each time. | High | Headers trusted only with `ONYQ_TRUST_PROXY=1` (set in the Docker image behind Caddy); otherwise traffic shares one bucket. Site-wide ceilings added for briefs and analytics. |
| 3 | A Server Action POST without an `Origin` header was accepted (Next.js lets it through). | Medium | `proxy.ts` refuses any non-GET request to `/admin` without this site's Origin (403). |
| 4 | Two-step codes could be replayed within their 90-second window. | Medium | Each code works once (last used step stored). |
| 5 | Turning off two-step sign-in needed only the password, with no attempt limit. | Medium | Needs password and a current code; rate limited and audited. |
| 6 | Parallel sign-in attempts each ran a 128 MB scrypt hash (memory exhaustion). | Medium | Hashing gated to two at a time; tampered hash parameters rejected. |
| 7 | JSON bodies without Content-Length were buffered whole. | Medium | Streaming read with a hard cap. |
| 8 | Analytics accepted `//host` paths that could later render as off-site links in the panel. | Low | Strict site-relative path check (also for the brief's page field and locale). |
| 9 | Accounts created by a teammate kept the password the teammate chose. | Low | Temporary passwords must be replaced at first sign-in (`/admin/password`). |
| 10 | An admin could switch off another admin. | Low | Only the owner can. |
| 11 | No safe way back in after a lost password. | Ops | `npm run admin` recovery tool (server access required, audited). |
| 12 | Password-only (2FA pending) sessions lived 12 h. | Low | 10 minutes. |

**Verified safe:**
- Security headers and nonce CSP on every response.
- No source maps, `.env`, database or source files are served.
- Every admin page, RSC payload, export and Server Action refuses anonymous callers.
- Cross-site actions are rejected.
- Stored XSS payloads render escaped.
- SQL injection payloads are stored as plain text.
- There are no open redirects, and the Host header can't poison redirects.
- Sign-in locks after 5 wrong passwords per account, with no oracle during the lockout.
- Oversized bodies are refused, and the server stays up under parallel sign-ins.
