import Link from "next/link";
import { requireUser } from "@/lib/server/auth.ts";
import { all } from "@/lib/server/db.ts";
import { breakdown, financeSummary, liveVisitors, pctChange, rangeFrom, tasks, trafficSeries, trafficTotals, eventCounts, type Lead } from "@/lib/server/admin-data.ts";
import { AreaChart } from "@/components/admin/charts.tsx";
import { Badge, BarList, Card, Empty, Kpi, PageHead, ago, date, dur, num, usd } from "@/components/admin/ui.tsx";
import { toggleTask } from "../actions.ts";

export const metadata = { title: "Overview" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser("viewer");
  const sp = await searchParams;
  const r = rangeFrom("30d");
  const w = rangeFrom("7d");
  const now = trafficTotals(w.from, w.to);
  const before = trafficTotals(w.prevFrom, w.from);
  const series = trafficSeries(r);
  const fin = financeSummary(6);
  const live = liveVisitors();
  const recentLeads = all<Lead>("SELECT * FROM leads WHERE status NOT IN ('spam','archived') ORDER BY created_at DESC LIMIT 6");
  const leads7 = all<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE created_at >= ? AND status != 'spam'", w.from)[0].n;
  const leadsPrev = all<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE created_at >= ? AND created_at < ? AND status != 'spam'", w.prevFrom, w.from)[0].n;
  const due = tasks({ open: true }).slice(0, 6);
  const pages = breakdown("path", w.from, w.to, 6);
  const events = eventCounts(w.from, w.to);
  const briefs = events.find((e) => e.name === "brief_sent")?.sessions ?? 0;
  const conv = now.sessions ? (briefs / now.sessions) * 100 : 0;
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Yerevan" }));
  const hello = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      {sp.denied ? <p className="a-msg a-msg--error">Your role doesn&apos;t allow that page.</p> : null}
      <PageHead
        title={`${hello}, ${user.name.split(" ")[0]}`}
        sub={
          <>
            <span className="a-live">
              <i /> {live} {live === 1 ? "person" : "people"} on the site now
            </span>
            <span className="a-sep">·</span> last 7 days compared with the 7 before
          </>
        }
        actions={
          <Link href="/admin/clients/new" className="a-btn a-btn--primary">
            + New client
          </Link>
        }
      />

      <div className="a-kpis">
        <Kpi label="Visitors" value={num(now.visitors)} delta={pctChange(now.visitors, before.visitors)} hint={`${num(now.pageviews)} page views`} />
        <Kpi label="New briefs" value={num(leads7)} delta={pctChange(leads7, leadsPrev)} hint={`${conv.toFixed(1)}% of visits`} />
        <Kpi label="Open pipeline" value={usd(fin.pipelineOpen)} hint={`${usd(fin.pipelineWeighted)} weighted`} />
        <Kpi label="Revenue this month" value={usd(fin.revenueThisMonth)} delta={pctChange(fin.revenueThisMonth, fin.revenueLastMonth)} hint={fin.outstanding ? `${usd(fin.outstanding)} to collect` : "nothing outstanding"} accent />
      </div>

      <div className="a-grid a-grid--2-1">
        <Card title="Traffic · last 30 days" action={<Link href="/admin/analytics" className="a-link">Analytics →</Link>}>
          <AreaChart
            labels={series.map((s) => s.day.slice(5))}
            series={[
              { name: "Visitors", values: series.map((s) => s.visitors), color: "1" },
              { name: "Page views", values: series.map((s) => s.pageviews), color: "2" },
            ]}
          />
          <div className="a-statrow">
            <span>
              Avg. time per visit <b>{dur(now.avgSessionMs)}</b>
            </span>
            <span>
              Pages per visit <b>{now.viewsPerSession.toFixed(1)}</b>
            </span>
            <span>
              Bounce <b>{now.bounceRate.toFixed(0)}%</b>
            </span>
          </div>
        </Card>
        <Card title="Most viewed · 7 days">
          <BarList rows={pages.map((p) => ({ key: p.key, value: p.visitors, hint: p.avg_ms ? dur(p.avg_ms) : "" }))} />
        </Card>
      </div>

      <div className="a-grid a-grid--2">
        <Card title="Latest briefs" action={<Link href="/admin/leads" className="a-link">Inbox →</Link>} pad={false}>
          {recentLeads.length ? (
            <ul className="a-list">
              {recentLeads.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="a-list__row">
                    <span className="a-avatar">{l.name.slice(0, 1).toUpperCase()}</span>
                    <span className="a-list__main">
                      <b>{l.name}</b>
                      <small>{l.challenge?.slice(0, 80)}</small>
                    </span>
                    <span className="a-list__side">
                      <Badge value={l.status} />
                      <small>{ago(l.created_at)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No briefs yet">Briefs sent from the website land here automatically.</Empty>
          )}
        </Card>
        <Card title="Follow-ups" action={<Link href="/admin/tasks" className="a-link">All tasks →</Link>} pad={false}>
          {due.length ? (
            <ul className="a-list">
              {due.map((t) => (
                <li key={t.id} className="a-list__row">
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="a-check" aria-label={`Mark "${t.title}" done`} />
                  </form>
                  <span className="a-list__main">
                    <b>{t.title}</b>
                    <small>{t.client_name ?? "—"}</small>
                  </span>
                  <span className="a-list__side">
                    <small className={t.due_date && t.due_date < new Date().toISOString().slice(0, 10) ? "a-overdue" : ""}>{date(t.due_date)}</small>
                    <Badge value={t.priority} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Nothing to follow up">Add tasks from a client page or the Tasks section.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
