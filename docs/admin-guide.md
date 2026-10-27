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
- **Site contacts:** Settings → Site contacts changes the email, phone and messenger links shown in the site header, footer and contacts page.

Admin pages, bots, automated browsers and visitors who send a Global Privacy Control ("do not track") signal are not counted.
