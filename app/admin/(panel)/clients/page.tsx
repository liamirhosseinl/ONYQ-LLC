import Link from "next/link";
import { requireUser } from "@/lib/server/auth.ts";
import { clients, CLIENT_STATUSES } from "@/lib/server/admin-data.ts";
import { Badge, Card, Empty, PageHead, Tabs, date, usd, ago } from "@/components/admin/ui.tsx";

export const metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireUser("viewer");
  const sp = await searchParams;
  const status = sp.status && (CLIENT_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "all";
  const q = (sp.q || "").slice(0, 80);
  const rows = clients(status, q);
  return (
    <>
      <PageHead
        title="Clients"
        sub={`${rows.length} ${rows.length === 1 ? "client" : "clients"}`}
        actions={
          <>
            <a href="/admin/export/clients" className="a-btn">Export CSV</a>
            <Link href="/admin/clients/new" className="a-btn a-btn--primary">+ New client</Link>
          </>
        }
      />
      <div className="a-toolbar">
        <Tabs current={status} items={["all", ...CLIENT_STATUSES].map((k) => ({ key: k, label: k === "all" ? "All" : k[0].toUpperCase() + k.slice(1), href: `/admin/clients${k === "all" ? "" : `?status=${k}`}` }))} />
        <form className="a-inline-search">
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <input name="q" defaultValue={q} placeholder="Search clients" aria-label="Search clients" maxLength={80} />
        </form>
      </div>
      <Card pad={false}>
        {rows.length ? (
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Contact</th>
                  <th className="a-right">Open deals</th>
                  <th>Next follow-up</th>
                  <th className="a-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/clients/${c.id}`} className="a-rowlink">
                        <span className="a-avatar">{c.name.slice(0, 1).toUpperCase()}</span>
                        <span>
                          <b>{c.name}</b>
                          <small>{c.company ?? c.source ?? ""}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <Badge value={c.status} />
                    </td>
                    <td className="a-muted">{c.email ?? c.phone ?? c.telegram ?? "—"}</td>
                    <td className="a-right">{c.open_value ? usd(c.open_value) : "—"}</td>
                    <td className={c.next_task && c.next_task < new Date().toISOString().slice(0, 10) ? "a-overdue" : ""}>{c.next_task ? date(c.next_task) : "—"}</td>
                    <td className="a-right a-muted">{ago(c.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No clients yet">
            Convert a brief from the Inbox, or <Link href="/admin/clients/new" className="a-link">add a client</Link> yourself.
          </Empty>
        )}
      </Card>
    </>
  );
}
