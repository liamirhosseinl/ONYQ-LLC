import Link from "next/link";
import { requireUser } from "@/lib/server/auth.ts";
import { search } from "@/lib/server/admin-data.ts";
import { Card, Empty, PageHead } from "@/components/admin/ui.tsx";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser("viewer");
  const q = ((await searchParams).q || "").trim().slice(0, 80);
  const r = q.length >= 2 ? search(q) : { clients: [], leads: [], invoices: [] };
  const total = r.clients.length + r.leads.length + r.invoices.length;
  return (
    <>
      <PageHead title={q ? `“${q}”` : "Search"} sub={q.length < 2 ? "Type at least two characters." : `${total} results`} />
      {total ? (
        <div className="a-grid a-grid--3">
          <Card title="Clients" pad={false}>
            <ul className="a-list">
              {r.clients.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/clients/${c.id}`} className="a-list__row">
                    <span className="a-list__main">
                      <b>{c.name}</b>
                      <small>{c.company}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Briefs" pad={false}>
            <ul className="a-list">
              {r.leads.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="a-list__row">
                    <span className="a-list__main">
                      <b>{l.name}</b>
                      <small>{l.email}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Invoices" pad={false}>
            <ul className="a-list">
              {r.invoices.map((i) => (
                <li key={i.id}>
                  <Link href={`/admin/clients/${i.client_id}`} className="a-list__row">
                    <span className="a-list__main">
                      <b>{i.number}</b>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : q.length >= 2 ? (
        <Card>
          <Empty title="Nothing found" />
        </Card>
      ) : null}
    </>
  );
}
