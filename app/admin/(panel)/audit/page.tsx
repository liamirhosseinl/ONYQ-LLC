import { requireUser } from "@/lib/server/auth.ts";
import { all } from "@/lib/server/db.ts";
import { Card, PageHead, dateTime } from "@/components/admin/ui.tsx";

export const metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page || 0) || 0);
  const rows = all<{ id: number; ts: number; action: string; entity: string | null; entity_id: string | null; meta: string | null; ip: string | null; name: string | null }>(
    "SELECT a.*, u.name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.ts DESC LIMIT 100 OFFSET ?",
    page * 100,
  );
  return (
    <>
      <PageHead title="Audit log" sub="Every sign-in, failed attempt and change. Kept for security reviews." />
      <Card pad={false}>
        <div className="a-tablewrap">
          <table className="a-table a-table--dense">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Item</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.action.includes("failed") || r.action.includes("locked") ? "is-warn" : ""}>
                  <td className="a-nowrap">{dateTime(r.ts)}</td>
                  <td>{r.name ?? "—"}</td>
                  <td>
                    <code>{r.action}</code>
                  </td>
                  <td>{r.entity ? `${r.entity} #${r.entity_id}` : "—"}</td>
                  <td className="a-clip a-muted">{r.meta ?? ""}</td>
                  <td className="a-muted">{r.ip ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="a-pager">
          {page > 0 ? <a href={`/admin/audit?page=${page - 1}`} className="a-btn">← Newer</a> : <span />}
          {rows.length === 100 ? <a href={`/admin/audit?page=${page + 1}`} className="a-btn">Older →</a> : null}
        </div>
      </Card>
    </>
  );
}
