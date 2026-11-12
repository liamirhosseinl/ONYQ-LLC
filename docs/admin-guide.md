# Admin panel guide

Address: `https://your-domain/admin`. It is hidden from search engines, and every page requires sign-in. First-time setup is in `docs/deployment.md`.

| Section | What it is for |
|---|---|
| **Overview** | The day at a glance: who is on the site now, visitors and briefs this week, revenue, money to collect, the newest briefs and today's follow-ups. |
| **Analytics** | Visitors, page views, average time on site, bounce rate and scroll depth, for 24 h / 7 / 30 / 90 / 365 days. Also: realtime visitors, top pages (with average time and scroll), traffic sources and UTM campaigns, countries, landing pages, the goal funnel (visit → brief opened → brief sent), devices, browsers, systems and languages. Export as CSV. |
| **Inbox** | Every brief sent from the site, saved even if email or webhook delivery fails. Each one shows the request, the page it came from and the visitor's path through the site before sending. Set a status, add notes, schedule a follow-up, or **convert to client** (this creates the client, a deal and the first activity). |
| **Clients** | The client base, with search and status filters. A client page holds contact details, deals, invoices and payments (with balance), an activity timeline (calls, meetings, emails, notes) and tasks. |
| **Pipeline** | Deals by stage (Lead → Qualified → Proposal → Negotiation → Won / Lost). Move a deal by dragging or with the stage menu. It shows the total and the probability-weighted value. |
| **Tasks** | Follow-ups across all clients: overdue, today, upcoming, done. |
| **Finance** | Revenue, expenses and profit this month; revenue this year; money to collect (with overdue amounts); monthly recurring revenue; a 12-month chart; invoices (numbered `ONYQ-YYYY-NNN`, with partial payments) and expenses. Amounts in AMD, RUB or EUR are converted to USD with the rates in Settings. |
| **Settings** | Your password and two-factor sign-in; active sessions; the site's public contacts (they update the website instantly); the team and roles; exchange rates; data export and analytics retention. |
| **Audit log** | Who did what and when: sign-ins, changes, deletions and exports. |

The search box at the top finds clients, briefs, invoices and deals.

## Roles

| Role | What it can do |
|---|---|
| Viewer | Read everything |
| Manager | Everything a viewer can, plus work with clients, deals, invoices, tasks and exports |
| Admin | Everything a manager can, plus delete records and change site contacts, rates and data settings |
| Owner | Everything an admin can, plus manage the team |

## How the website feeds the panel

- **Analytics:** the site's own beacon (no Google Analytics, no cookies) records each page view: page, referrer, UTM tags, device, language, and country from the CDN or the browser language. When the visitor leaves, it adds the time spent and how far they scrolled.
- **Goals:** opening the brief form and sending it are tracked as events.
- **Briefs:** each sent brief goes into the Inbox with the page and visitor path.
- **Site contacts:** Settings → Site contacts changes the email, phone and messenger links shown in the site header, footer and contacts page. A field left empty shows the default from `data/site-config.ts`.
- **VIP requests:** requests from the VIP lounge (`/vip`) land in the Inbox with a gold "VIP · business name" chip. The request page shows the chosen services with public and VIP (−60%) prices. Invitation codes have the form `business/963`: give the client the business name followed by `/963`. To change the secret part, set `ONYQ_VIP_SUFFIX` on the server; codes with the old suffix stop working immediately.

Admin pages, bots, automated browsers and visitors who send a Global Privacy Control ("do not track") signal are not counted.

## Website content (CMS)

Everything visitors read on onyq.am can be changed in the panel without touching code. That covers every text in all three languages, prices, services, portfolio projects, images and the interface words (menus, buttons, form labels).

**Where to find it** (left menu → *Website*):

- **Content** lists every section of the site: pages, service pages, direction pages, project texts, service names and interface texts. Each language has a dot:
  - grey: the original text;
  - green: edited and live;
  - amber: a draft that isn't published yet.
- **Services & prices** is the price list: price in USD, one-time or monthly, timeline, category, order, "top" (shown in *Most requested*) and visible/hidden.
  - **Add a service** needs an ID and a name in all three languages.
  - Its description and name can later be edited in *Service names, descriptions & categories*.
- **Portfolio** holds the projects: order, visible/hidden, client name, website, year, status (live or preview), accent colours, headline number, directions, services used, cover and gallery images, and videos.
  - **Add a project** needs an address, an English name and a cover image.
  - Its story is written in the project's texts, per language.
- **Media** is the library. Upload images (JPG, PNG, WebP or AVIF, up to 25 MB; they are converted to WebP, max 2400 px wide) and videos (MP4 or WebM, up to 80 MB).
  - Files already used on the site are listed too.
  - An upload can be deleted only when no page uses it.

**How a change goes live:**

1. Edit, then **Save draft** (or press Ctrl/Cmd + S). Visitors still see the old version.
2. **Preview ↗** opens the site with your drafts. A gold bar at the bottom says you are in preview; **Exit preview** returns to the live view. Only signed-in editors can see drafts.
3. **Publish** makes the change live at once. *Content → Publish all drafts* publishes everything waiting.
4. **History** (at the bottom of every editor) lists each published version. **Restore as draft** brings an older one back, including the original text.

**Translations.**

- When you edit Russian or Armenian, the English text is shown under every field.
- If the English is changed later, the field is marked **"English changed — check"**. Either update the translation, or click **Still correct**.
- **Only fields whose English changed** shows just those fields.

**Safety rails:**

- Interface texts keep their placeholders. `{count}`, `{name}` and tags like `<b>…</b>` must stay exactly as they are, or the save is refused with an explanation.
- Links must start with `/` (a page of this site), `https://`, `mailto:` or `tel:`.
- Technical keys (IDs, page addresses) are shown, not edited.
- Lists whose length is part of the design are fixed. Examples: two-line titles, and story steps that each have their own picture.

**Who can do what:**

| Role | Content |
|---|---|
| viewer | see the editors |
| manager | edit, save drafts, preview, upload media |
| admin / owner | publish, restore versions, delete media |

Every save, publish, restore and upload is in the **Audit log**.
