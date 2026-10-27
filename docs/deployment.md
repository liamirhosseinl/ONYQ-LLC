# Deployment

The site and the admin panel are one Node.js app with one SQLite file. Hosting therefore needs a server or container with a **persistent disk**: a small VPS (Hetzner, DigitalOcean, a local Armenian provider) is ideal. Serverless hosts without a persistent disk (plain Vercel/Netlify) are **not suitable** for the admin panel, because its data would be lost on every deploy.

## Requirements

- Node.js **22.13 or newer** (22 LTS recommended). The built-in `node:sqlite` module is used; Node prints an "ExperimentalWarning" for it, which is harmless (the Docker image hides it).
- 1 vCPU / 1 GB RAM is enough to start.
- A domain pointed at the server (A/AAAA records).

## Option A — Docker (recommended)

```bash
cp .env.example .env.production     # fill in, see below
# edit deploy/Caddyfile and docker-compose.yml: replace onyq.am with your domain
docker compose up -d --build
docker compose logs web | grep -i "setup token"   # one-time admin setup token
```

Then open `https://your-domain/admin`, paste the setup token, and create the owner account. Enable two-factor right away (Admin → Settings).

The `web` container hardening:
- non-root user;
- read-only filesystem;
- all Linux capabilities dropped;
- `no-new-privileges`;
- data only in the `onyq-data` volume.

Caddy handles HTTPS certificates automatically.

## Option B — plain Node + nginx/Caddy

```bash
npm ci
NEXT_PUBLIC_SITE_MODE=production NEXT_PUBLIC_SITE_URL=https://onyq.am npm run build
# listen on localhost only, so the internet reaches the app through the proxy and nowhere else
ONYQ_DATA_DIR=/var/lib/onyq ONYQ_TRUST_PROXY=1 NODE_ENV=production npx next start -H 127.0.0.1 -p 3000
```

- Run it under systemd or pm2 as an unprivileged user.
- Make `/var/lib/onyq` owned by that user with mode 700.
- Use `deploy/nginx.conf.example` or `deploy/Caddyfile` as the proxy config.
- **The proxy must overwrite `X-Forwarded-For` and `X-Real-IP`.** Both examples do.

## Environment

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_MODE` | yes | `production` at launch (enables indexing, hides review markers). Build-time. |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://onyq.am`, no trailing slash. Build-time. |
| `ONYQ_DATA_DIR` | yes in prod | Persistent, private folder for `onyq.db` and the setup token. |
| `ONYQ_TRUST_PROXY` | yes behind a proxy | `1` when Caddy/nginx sits in front (the Docker image sets it). Without it, visitor IPs are not read from headers and everyone shares one rate-limit bucket. Never set it if the app port is reachable from the internet. |
| `ONYQ_TRUST_CLOUDFLARE` | no | `1` only behind Cloudflare. |
| `ENQUIRY_WEBHOOK_URL` / `RESEND_API_KEY` … | no | Briefs are always saved to the admin Inbox; these additionally forward them. |

## First run

1. Start the app. With no admin accounts, it creates `ONYQ_DATA_DIR/setup-token.txt` and prints its path in the log.
2. Go to `/admin`. It redirects to `/admin/setup`.
3. Enter the token, your name, email and a password (12+ characters).
4. Settings → Two-factor: scan the QR code and confirm a code.
5. Settings → Site contacts: enter the public email, phone, Telegram and the security contact. They appear on the site immediately, with no redeploy needed.
6. Settings → Team: invite colleagues with the smallest role they need.

## Lost password or phone (recovery)

Run the recovery tool on the server, in the project folder. Only someone with access to the machine can use it.

```bash
npm run admin -- users                        # list accounts and their sign-in emails
npm run admin -- reset-password you@onyq.am   # prints a one-time password; a new one must be chosen at sign-in
npm run admin -- disable-2fa you@onyq.am      # lost authenticator phone
# Docker: docker compose exec web node scripts/admin.mjs reset-password you@onyq.am
```

Every use is written to the audit log.

## Backups (do not skip)

The whole business database is `ONYQ_DATA_DIR/onyq.db`. Take a consistent copy daily, for example:

```bash
sqlite3 /var/lib/onyq/onyq.db ".backup '/backups/onyq-$(date +%F).db'"
# or, without the sqlite3 tool:
node -e "new (require('node:sqlite').DatabaseSync)('/var/lib/onyq/onyq.db').exec(\"VACUUM INTO '/backups/onyq-$(date +%F).db'\")"
```

Encrypt the copies and keep them off the server (another region or provider). Keep 30 days. Try a restore once: stop the app, replace the file, start it again.

## Updates

```bash
git pull && npm ci && npm audit && npm run build && systemctl restart onyq
# Docker: docker compose up -d --build
```

Database migrations run automatically on start and are append-only (they never drop data).

## After go-live checklist

- [ ] securityheaders.com → A+
- [ ] ssllabs.com/ssltest → A or A+
- [ ] `/admin` asks for sign-in; `/robots.txt` disallows `/admin` and `/api/`
- [ ] Submit a test brief on the site → it appears in Admin → Inbox
- [ ] Browse a few pages in a normal browser → they appear in Admin → Analytics → Realtime
- [ ] Backups are running and one restore was tested
- [ ] 2FA is enabled for every admin account
