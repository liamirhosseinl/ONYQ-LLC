import Link from "next/link";
import { requireUser, can } from "@/lib/server/auth.ts";
import { clientOptions, expenses, financeSummary, invoices, CURRENCIES, INVOICE_STATUSES } from "@/lib/server/admin-data.ts";
import { Columns } from "@/components/admin/charts.tsx";
import { Badge, Card, Empty, Kpi, PageHead, Tabs, date, inDays, money, todayIso, usd, pctChangeLabel } from "@/components/admin/ui.tsx";
import { AutoSelect, ConfirmSubmit, Submit } from "@/components/admin/forms.tsx";
import { addExpense, createInvoice, deleteExpense, deleteInvoice, setInvoiceStatus } from "../../actions.ts";

export const metadata = { title: "Finance" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CATEGORIES = ["Salaries", "Freelancers", "Software & hosting", "Advertising", "Office", "Taxes", "Equipment", "Other"];

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser("viewer");
  const sp = await searchParams;
  const status = sp.status && (INVOICE_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "all";
  const fin = financeSummary(12);
  const inv = invoices({ status: status === "overdue" ? undefined : status }).filter((i) => (status === "overdue" ? i.status === "overdue" : true));
  const exp = expenses(50);
  const clients = clientOptions();
  const editable = can(user, "manager");
  const profit = fin.revenueThisMonth - fin.expensesThisMonth;

  return (
    <>
      <PageHead title="Finance" sub="Totals are converted to USD with the rates in Settings." actions={<a href="/admin/export/invoices" className="a-btn">Export CSV</a>} />
      <div className="a-kpis a-kpis--6">
        <Kpi label="Revenue this month" value={usd(fin.revenueThisMonth)} hint={pctChangeLabel(fin.revenueThisMonth, fin.revenueLastMonth)} accent />
        <Kpi label="Expenses this month" value={usd(fin.expensesThisMonth)} />
        <Kpi label="Profit this month" value={usd(profit)} />
        <Kpi label="Revenue this year" value={usd(fin.ytd)} />
        <Kpi label="To collect" value={usd(fin.outstanding)} hint={fin.overdue ? `${usd(fin.overdue)} overdue` : "none overdue"} />
        <Kpi label="Monthly recurring" value={usd(fin.mrr)} hint="won monthly deals" />
      </div>

      <Card title="Revenue and expenses · 12 months">
        <Columns
          labels={fin.months.map((m) => MONTHS[Number(m.month.slice(5)) - 1])}
          series={[
            { name: "Revenue", values: fin.months.map((m) => m.revenue), color: "1" },
            { name: "Expenses", values: fin.months.map((m) => m.expenses), color: "2" },
          ]}
          unit="usd"
        />
      </Card>

      <Card
        title="Invoices"
        action={<Tabs current={status} items={["all", "draft", "sent", "partial", "overdue", "paid", "void"].map((k) => ({ key: k, label: k === "all" ? "All" : k[0].toUpperCase() + k.slice(1), href: `/admin/finance${k === "all" ? "" : `?status=${k}`}` }))} />}
        pad={false}
      >
        {inv.length ? (
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th className="a-right">Amount</th>
                  <th className="a-right">Paid</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {inv.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <b>{i.number}</b>
                      {i.description ? <small className="a-block">{i.description}</small> : null}
                    </td>
                    <td>
                      <Link href={`/admin/clients/${i.client_id}`} className="a-link">
                        {i.client_name}
                      </Link>
                    </td>
                    <td>{date(i.issue_date)}</td>
                    <td className={i.status === "overdue" ? "a-overdue" : ""}>{date(i.due_date)}</td>
                    <td className="a-right">{money(i.amount, i.currency)}</td>
                    <td className="a-right">{money(i.paid, i.currency)}</td>
                    <td>
                      {editable ? (
                        <form action={setInvoiceStatus} className="a-inline">
                          <input type="hidden" name="id" value={i.id} />
                          <AutoSelect name="status" value={i.status === "overdue" ? "sent" : i.status} label="Status" options={["draft", "sent", "paid", "partial", "void"].map((s) => ({ value: s, label: s }))} />
                          {i.status === "overdue" ? <Badge value="overdue" /> : null}
                        </form>
                      ) : (
                        <Badge value={i.status} />
                      )}
                    </td>
                    <td className="a-right">
                      {can(user, "admin") ? (
                        <form action={deleteInvoice}>
                          <input type="hidden" name="id" value={i.id} />
                          <ConfirmSubmit className="a-iconbtn a-iconbtn--danger" confirm="Delete?">
                            ×
                          </ConfirmSubmit>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No invoices here">Create invoices from a client page or below.</Empty>
        )}
        {editable && clients.length ? (
          <details className="a-details a-pad">
            <summary>+ New invoice</summary>
            <form action={createInvoice} className="a-form a-form--grid">
              <label className="a-field">
                <span>Client</span>
                <select name="clientId" className="a-select" required>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` — ${c.company}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="a-field">
                <span>Amount</span>
                <input name="amount" type="number" min={1} step="0.01" required />
              </label>
              <label className="a-field">
                <span>Currency</span>
                <select name="currency" className="a-select">
                  {CURRENCIES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="a-field">
                <span>Issued</span>
                <input name="issueDate" type="date" required defaultValue={todayIso()} />
              </label>
              <label className="a-field">
                <span>Due</span>
                <input name="dueDate" type="date" required defaultValue={inDays(14)} />
              </label>
              <label className="a-field">
                <span>Status</span>
                <select name="status" className="a-select" defaultValue="sent">
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                </select>
              </label>
              <label className="a-field a-field--wide">
                <span>Description</span>
                <input name="description" maxLength={1000} />
              </label>
              <div className="a-field--wide">
                <Submit>Create invoice</Submit>
              </div>
            </form>
          </details>
        ) : null}
      </Card>

      <Card title="Expenses" pad={false}>
        {exp.length ? (
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Note</th>
                  <th className="a-right">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {exp.map((e) => (
                  <tr key={e.id}>
                    <td>{date(e.date)}</td>
                    <td>
                      <span className="a-chip">{e.category}</span>
                    </td>
                    <td className="a-muted">{e.note ?? "—"}</td>
                    <td className="a-right">{money(e.amount, e.currency)}</td>
                    <td className="a-right">
                      {can(user, "admin") ? (
                        <form action={deleteExpense}>
                          <input type="hidden" name="id" value={e.id} />
                          <ConfirmSubmit className="a-iconbtn a-iconbtn--danger" confirm="Delete?">
                            ×
                          </ConfirmSubmit>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No expenses recorded" />
        )}
        {editable ? (
          <form action={addExpense} className="a-form a-form--row a-pad">
            <input name="date" type="date" required defaultValue={todayIso()} aria-label="Date" />
            <select name="category" className="a-select" aria-label="Category">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input name="amount" type="number" min={0.01} step="0.01" required placeholder="Amount" aria-label="Amount" />
            <select name="currency" className="a-select" aria-label="Currency">
              {CURRENCIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <input name="note" maxLength={300} placeholder="Note" aria-label="Note" className="a-grow" />
            <Submit>Add expense</Submit>
          </form>
        ) : null}
      </Card>
    </>
  );
}
