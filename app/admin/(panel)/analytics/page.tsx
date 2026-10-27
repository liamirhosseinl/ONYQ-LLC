import { requireUser } from "@/lib/server/auth.ts";
import { breakdown, entryPages, eventCounts, hourlySeries, livePages, liveVisitors, pctChange, rangeFrom, trafficSeries, trafficTotals } from "@/lib/server/admin-data.ts";
import { AreaChart, Columns } from "@/components/admin/charts.tsx";
import { BarList, Card, Kpi, PageHead, Tabs, country, dur, num } from "@/components/admin/ui.tsx";
import { AutoRefresh } from "@/components/admin/forms.tsx";

export const metadata = { title: "Analytics" };

const RANGES = [
  { key: "1d", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "365d", label: "12 months" },
];

const EVENT_LABEL: Record<string, string> = { brief_open: "Brief opened", brief_sent: "Brief sent" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireUser("viewer");
  const sp = await searchParams;
  const key = RANGES.some((r) => r.key === sp.range) ? sp.range! : "7d";
  const r = rangeFrom(key);
  const t = trafficTotals(r.from, r.to);
  const p = trafficTotals(r.prevFrom, r.from);
  const series = r.days === 1 ? null : trafficSeries(r);
  const hourly = r.days === 1 ? hourlySeries() : null;
  const pages = breakdown("path", r.from, r.to, 12);
  const entries = entryPages(r.from, r.to);
  const sources = breakdown("referrer", r.from, r.to, 10);
  const campaigns = breakdown("utm_source", r.from, r.to, 6).filter((c) => c.key !== "Unknown");
  const countries = breakdown("country", r.from, r.to, 10);
  const devices = breakdown("device", r.from, r.to, 4);
  const browsers = breakdown("browser", r.from, r.to, 6);
  const systems = breakdown("os", r.from, r.to, 6);
  const langs = breakdown("locale", r.from, r.to, 4);
  const events = eventCounts(r.from, r.to);
  const live = liveVisitors();
  const livePg = livePages();
  const opened = events.find((e) => e.name === "brief_open")?.sessions ?? 0;
  const sent = events.find((e) => e.name === "brief_sent")?.sessions ?? 0;

  return (
    <>
      <AutoRefresh seconds={60} />
      <PageHead
        title="Analytics"
        sub="Cookieless and first-party: no third-party trackers, no personal data, IPs never stored."
        actions={<Tabs current={key} items={RANGES.map((x) => ({ key: x.key, label: x.label, href: `/admin/analytics?range=${x.key}` }))} />}
      />

      <div className="a-kpis a-kpis--6">
        <Kpi label="Visitors" value={num(t.visitors)} delta={pctChange(t.visitors, p.visitors)} />
        <Kpi label="Visits" value={num(t.sessions)} delta={pctChange(t.sessions, p.sessions)} />
        <Kpi label="Page views" value={num(t.pageviews)} delta={pctChange(t.pageviews, p.pageviews)} />
        <Kpi label="Time per visit" value={dur(t.avgSessionMs)} delta={pctChange(t.avgSessionMs, p.avgSessionMs)} />
        <Kpi label="Bounce rate" value={`${t.bounceRate.toFixed(0)}%`} hint="one page only" />
        <Kpi label="Scroll depth" value={`${t.avgScroll.toFixed(0)}%`} hint="average per page" />
      </div>

      <div className="a-grid a-grid--2-1">
        <Card title={r.days === 1 ? "Page views · last 24 hours" : "Visitors and page views"}>
          {hourly ? (
            <Columns labels={hourly.map((h) => h.label)} series={[{ name: "Page views", values: hourly.map((h) => h.value), color: "1" }]} />
          ) : (
            <AreaChart
              labels={series!.map((s) => s.day.slice(5))}
              series={[
                { name: "Visitors", values: series!.map((s) => s.visitors), color: "1" },
                { name: "Page views", values: series!.map((s) => s.pageviews), color: "2" },
              ]}
            />
          )}
        </Card>
        <Card
          title={
            <span className="a-live">
              <i /> Right now
            </span>
          }
        >
          <p className="a-bignum">{live}</p>
          <p className="a-muted">{live === 1 ? "visitor in the last 5 minutes" : "visitors in the last 5 minutes"}</p>
          <BarList rows={livePg.map((x) => ({ key: x.key, value: x.n }))} empty="Nobody on the site at the moment." />
        </Card>
      </div>

      <div className="a-grid a-grid--2">
        <Card title="Pages" pad={false}>
          <BarList rows={pages.map((x) => ({ key: x.key, value: x.visitors, hint: `${num(x.views)} views · ${x.avg_ms ? dur(x.avg_ms) : "—"}` }))} total={t.visitors} />
        </Card>
        <Card title="Where visitors come from" pad={false}>
          <BarList rows={sources.map((x) => ({ key: x.key, value: x.visitors }))} total={t.visitors} />
          {campaigns.length ? (
            <>
              <p className="a-subhead">Campaigns (utm_source)</p>
              <BarList rows={campaigns.map((x) => ({ key: x.key, value: x.visitors }))} />
            </>
          ) : null}
        </Card>
      </div>

      <div className="a-grid a-grid--3">
        <Card title="Countries" pad={false}>
          <BarList rows={countries.map((x) => ({ key: country(x.key), value: x.visitors }))} total={t.visitors} />
        </Card>
        <Card title="Landing pages" pad={false}>
          <BarList rows={entries.map((x) => ({ key: x.key, value: x.sessions }))} />
        </Card>
        <Card title="Goals" pad={false}>
          <div className="a-funnel">
            <div>
              <span>Visits</span>
              <b>{num(t.sessions)}</b>
            </div>
            <div>
              <span>Opened the brief</span>
              <b>{num(opened)}</b>
              <em>{t.sessions ? ((opened / t.sessions) * 100).toFixed(1) : "0"}%</em>
            </div>
            <div>
              <span>Sent a brief</span>
              <b>{num(sent)}</b>
              <em>{t.sessions ? ((sent / t.sessions) * 100).toFixed(1) : "0"}%</em>
            </div>
          </div>
          <BarList rows={events.map((e) => ({ key: EVENT_LABEL[e.name] ?? e.name, value: e.n }))} empty="No events yet." />
        </Card>
      </div>

      <div className="a-grid a-grid--4">
        <Card title="Devices" pad={false}>
          <BarList rows={devices.map((x) => ({ key: x.key, value: x.visitors }))} total={t.visitors} />
        </Card>
        <Card title="Browsers" pad={false}>
          <BarList rows={browsers.map((x) => ({ key: x.key, value: x.visitors }))} total={t.visitors} />
        </Card>
        <Card title="Systems" pad={false}>
          <BarList rows={systems.map((x) => ({ key: x.key, value: x.visitors }))} total={t.visitors} />
        </Card>
        <Card title="Site language" pad={false}>
          <BarList rows={langs.map((x) => ({ key: x.key.toUpperCase(), value: x.visitors }))} total={t.visitors} />
        </Card>
      </div>
    </>
  );
}
