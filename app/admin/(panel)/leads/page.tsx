import Link from "next/link";
import { requireUser } from "@/lib/server/auth.ts";
import { leadCounts, leads, LEAD_STATUSES } from "@/lib/server/admin-data.ts";
import { Badge, Card, Empty, PageHead, Tabs, ago } from "@/components/admin/ui.tsx";

export const metadata = { title: "Inbox" };

const LABEL: Record<string, string> = {
  all: "Open",
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  spam: "Spam",
  archived: "Archived",
};
const BUDGET: Record<string, string> = { "under-1k": "< $1k", "1k-5k": "$1–5k", "5k-15k": "$5–15k", "15k-plus": "$15k+", "not-sure": "not sure" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireUser("viewer");
  const sp = await searchParams;
  const status = sp.status && (LEAD_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "all";
  const q = (sp.q || "").slice(0, 80);
  const rows = leads(status, q);
  const counts = leadCounts();
  const open = Object.entries(counts).filter(([k]) => k !== "spam" && k !== "archived").reduce((s, [, v]) => s + v, 0);

  return (
    <>
      <PageHead title="Inbox" sub="Every brief sent from the website, with the visitor's path before they wrote." />
      <div className="a-toolbar">
        <Tabs
          current={status}
          items={["all", ...LEAD_STATUSES].map((k) => ({ key: k, label: LABEL[k], count: k === "all" ? open : (counts[k] ?? 0), href: `/admin/leads${k === "all" ? "" : `?status=${k}`}` }))}
        />
        <form className="a-inline-search">
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <input name="q" defaultValue={q} placeholder="Search briefs" aria-label="Search briefs" maxLength={80} />
        </form>
      </div>
      <Card pad={false}>
        {rows.length ? (
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Request</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th className="a-right">Received</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className={l.status === "new" ? "is-new" : ""}>
                    <td>
                      <Link href={`/admin/leads/${l.id}`} className="a-rowlink">
                        <span className="a-avatar">{l.name.slice(0, 1).toUpperCase()}</span>
                        <span>
                          <b>{l.name}</b>
                          <small>{l.company || l.email}</small>
                        </span>
                      </Link>
                    </td>
                    <td className="a-clip">
                      <span className="a-chip">{l.challenge_type}</span> {l.challenge}
                    </td>
                    <td>{l.budget ? BUDGET[l.budget] : "—"}</td>
                    <td>
                      <Badge value={l.status} />
                    </td>
                    <td className="a-right a-muted">{ago(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={q ? "Nothing matches that search" : "No briefs here"}>When someone sends a brief on the website, it appears here instantly.</Empty>
        )}
      </Card>
    </>
  );
}
