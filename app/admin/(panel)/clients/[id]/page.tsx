import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, can } from "@/lib/server/auth.ts";
import { activities, client, deals, fxRates, invoices, tasks, toUsd, DEAL_STAGES, CURRENCIES } from "@/lib/server/admin-data.ts";
import { all } from "@/lib/server/db.ts";
import { services } from "@/data/services.ts";
import { getCatalogueCopy } from "@/content/index.ts";
import { Badge, Card, Empty, Kpi, PageHead, date, dateTime, inDays, money, todayIso, usd } from "@/components/admin/ui.tsx";
import { AutoSelect, ConfirmSubmit, Submit } from "@/components/admin/forms.tsx";
import { addActivity, addPayment, createInvoice, createTask, deleteClient, moveDeal, saveDeal, setInvoiceStatus, toggleTask } from "../../../actions.ts";
import { ClientForm } from "../ClientForm.tsx";

export const metadata = { title: "Client" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("viewer");
  const { id } = await params;
  const c = client(Number(id));
  if (!c) notFound();
  const ds = deals(c.id);
  const inv = invoices({ clientId: c.id });
  const ts = tasks({ clientId: c.id });
  const acts = activities({ clientId: c.id });
  const fromLeads = all<{ id: number; created_at: number }>("SELECT id, created_at FROM leads WHERE client_id = ? ORDER BY created_at DESC", c.id);
  const rates = fxRates();
  const billed = inv.filter((i) => i.status !== "void" && i.status !== "draft").reduce((s, i) => s + toUsd(i.amount, i.currency, rates), 0);
  const paid = inv.reduce((s, i) => s + toUsd(i.paid, i.currency, rates), 0);
  const open = ds.filter((d) => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + d.value_usd, 0);
  const won = ds.filter((d) => d.stage === "won").reduce((s, d) => s + d.value_usd, 0);
  const editable = can(user, "manager");
  const names = getCatalogueCopy("en").serviceCopy as Record<string, { name: string }>;

  return (
    <>
      <PageHead
        title={c.name}
        sub={
          <>
            <Link href="/admin/clients" className="a-link">
              ← Clients
            </Link>
            <span className="a-sep">·</span>
            {c.company ? <>{c.company} · </> : null}
            <Badge value={c.status} />
            {c.tags ? c.tags.split(",").map((t) => <span key={t} className="a-chip">{t.trim()}</span>) : null}
          </>
        }
        actions={
          <>
            {c.email ? (
              <a className="a-btn" href={`mailto:${c.email}`}>
                Email
              </a>
            ) : null}
            {c.telegram ? (
              <a className="a-btn" href={`https://t.me/${encodeURIComponent(c.telegram.replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, ""))}`} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            ) : null}
          </>
        }
      />

      <div className="a-kpis">
        <Kpi label="Won" value={usd(won)} />
        <Kpi label="Open deals" value={usd(open)} />
        <Kpi label="Invoiced" value={usd(billed)} />
        <Kpi label="Paid" value={usd(paid)} hint={billed - paid > 0.5 ? `${usd(billed - paid)} to collect` : "all settled"} accent />
      </div>

      <div className="a-grid a-grid--2-1">
        <div className="a-stack">
          <Card title="Deals">
            {ds.length ? (
              <ul className="a-list">
                {ds.map((d) => (
                  <li key={d.id} className="a-list__row">
                    <span className="a-list__main">
                      <b>{d.title}</b>
                      <small>
                        {d.service_id ? names[d.service_id]?.name ?? d.service_id : "—"} · {d.recurring ? "monthly" : "one-off"}
                        {d.expected_close ? ` · close ${date(d.expected_close)}` : ""}
                      </small>
                    </span>
                    <span className="a-list__side">
                      <b>{usd(d.value_usd)}</b>
                      {editable ? (
                        <form action={moveDeal}>
                          <input type="hidden" name="id" value={d.id} />
                          <AutoSelect name="stage" value={d.stage} label="Stage" options={DEAL_STAGES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
                        </form>
                      ) : (
                        <Badge value={d.stage} />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="a-muted">No deals yet.</p>
            )}
            {editable ? (
              <details className="a-details">
                <summary>+ Add a deal</summary>
                <form action={saveDeal} className="a-form a-form--grid">
                  <input type="hidden" name="clientId" value={c.id} />
                  <label className="a-field a-field--wide">
                    <span>Title</span>
                    <input name="title" required maxLength={160} placeholder="Online store redesign" />
                  </label>
                  <label className="a-field">
                    <span>Service</span>
                    <select name="serviceId" className="a-select" defaultValue="">
                      <option value="">—</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {names[s.id]?.name ?? s.id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="a-field">
                    <span>Value (USD)</span>
                    <input name="value" type="number" min={0} step={1} required defaultValue={0} />
                  </label>
                  <label className="a-field">
                    <span>Stage</span>
                    <select name="stage" className="a-select" defaultValue="discovery">
                      {DEAL_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="a-field">
                    <span>Expected close</span>
                    <input name="expectedClose" type="date" />
                  </label>
                  <label className="a-check-field">
                    <input type="checkbox" name="recurring" /> Monthly / recurring
                  </label>
                  <div className="a-field--wide">
                    <Submit>Add deal</Submit>
                  </div>
                </form>
              </details>
            ) : null}
          </Card>

          <Card title="Invoices & payments">
            {inv.length ? (
              <div className="a-tablewrap">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Issued</th>
                      <th>Due</th>
                      <th className="a-right">Amount</th>
                      <th className="a-right">Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <b>{i.number}</b>
                          {i.description ? <small className="a-block">{i.description}</small> : null}
                        </td>
                        <td>{date(i.issue_date)}</td>
                        <td className={i.status === "overdue" ? "a-overdue" : ""}>{date(i.due_date)}</td>
                        <td className="a-right">{money(i.amount, i.currency)}</td>
                        <td className="a-right">{money(i.paid, i.currency)}</td>
                        <td>
                          {editable ? (
                            <form action={setInvoiceStatus}>
                              <input type="hidden" name="id" value={i.id} />
                              <AutoSelect name="status" value={i.status === "overdue" ? "sent" : i.status} label="Status" options={["draft", "sent", "paid", "partial", "void"].map((s) => ({ value: s, label: s }))} />
                            </form>
                          ) : (
                            <Badge value={i.status} />
                          )}
                          {i.status === "overdue" ? <Badge value="overdue" /> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="a-muted">No invoices yet.</p>
            )}
            {editable ? (
              <div className="a-two">
                <details className="a-details">
                  <summary>+ New invoice</summary>
                  <form action={createInvoice} className="a-form a-form--grid">
                    <input type="hidden" name="clientId" value={c.id} />
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
                      <span>Deal</span>
                      <select name="dealId" className="a-select" defaultValue="">
                        <option value="">—</option>
                        {ds.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
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
                      <input name="description" maxLength={1000} placeholder="Stage 1 of 2 — design" />
                    </label>
                    <div className="a-field--wide">
                      <Submit>Create invoice</Submit>
                    </div>
                  </form>
                </details>
                {inv.some((i) => i.status !== "paid" && i.status !== "void") ? (
                  <details className="a-details">
                    <summary>+ Record a payment</summary>
                    <form action={addPayment} className="a-form a-form--grid">
                      <label className="a-field a-field--wide">
                        <span>Invoice</span>
                        <select name="invoiceId" className="a-select">
                          {inv
                            .filter((i) => i.status !== "paid" && i.status !== "void")
                            .map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.number} — {money(i.amount - i.paid, i.currency)} left
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="a-field">
                        <span>Amount</span>
                        <input name="amount" type="number" min={0.01} step="0.01" required />
                      </label>
                      <label className="a-field">
                        <span>Date</span>
                        <input name="date" type="date" required defaultValue={todayIso()} />
                      </label>
                      <label className="a-field a-field--wide">
                        <span>Method</span>
                        <input name="method" maxLength={60} placeholder="bank transfer, card, cash…" />
                      </label>
                      <div className="a-field--wide">
                        <Submit>Record payment</Submit>
                      </div>
                    </form>
                  </details>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card title="Activity">
            {editable ? (
              <form action={addActivity} className="a-form a-form--row">
                <input type="hidden" name="clientId" value={c.id} />
                <select name="kind" className="a-select" aria-label="Kind">
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="email">Email</option>
                  <option value="message">Message</option>
                </select>
                <input name="body" required maxLength={5000} placeholder="Log a call, a decision, a promise…" className="a-grow" />
                <Submit>Add</Submit>
              </form>
            ) : null}
            {acts.length ? (
              <ul className="a-timeline">
                {acts.map((a) => (
                  <li key={a.id}>
                    <span className={`a-timeline__dot a-timeline__dot--${a.kind}`} />
                    <p>{a.body}</p>
                    <small>
                      {a.kind} · {a.user_name ?? "system"} · {dateTime(a.ts)}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="a-muted">Nothing logged yet.</p>
            )}
          </Card>
        </div>

        <div className="a-stack">
          <Card title="Contact">
            <dl className="a-dl a-dl--single">
              {[
                ["Email", c.email],
                ["Phone", c.phone],
                ["Telegram", c.telegram],
                ["Country", c.country],
                ["Language", c.language?.toUpperCase()],
                ["Source", c.source],
                ["Client since", date(c.created_at)],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
            {fromLeads.length ? (
              <p className="a-small a-muted">
                From {fromLeads.length === 1 ? "a website brief" : `${fromLeads.length} website briefs`}:{" "}
                {fromLeads.map((l) => (
                  <Link key={l.id} href={`/admin/leads/${l.id}`} className="a-link">
                    #{l.id}{" "}
                  </Link>
                ))}
              </p>
            ) : null}
            {c.notes ? <p className="a-note">{c.notes}</p> : null}
          </Card>

          <Card title="Tasks">
            <ul className="a-list a-list--tight">
              {ts.map((t) => (
                <li key={t.id} className={`a-list__row${t.done ? " is-done" : ""}`}>
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className={`a-check${t.done ? " is-checked" : ""}`} aria-label={t.done ? "Mark not done" : "Mark done"} />
                  </form>
                  <span className="a-list__main">
                    <b>{t.title}</b>
                  </span>
                  <small className={!t.done && t.due_date && t.due_date < todayIso() ? "a-overdue" : "a-muted"}>{date(t.due_date)}</small>
                </li>
              ))}
            </ul>
            {editable ? (
              <form action={createTask} className="a-form">
                <input type="hidden" name="clientId" value={c.id} />
                <input name="title" required maxLength={200} placeholder="Next step…" aria-label="Task" />
                <div className="a-form__row">
                  <input type="date" name="dueDate" defaultValue={inDays(3)} aria-label="Due date" />
                  <Submit className="a-btn">Add</Submit>
                </div>
              </form>
            ) : null}
          </Card>

          {editable ? (
            <Card>
              <details className="a-details">
                <summary>Edit details</summary>
                <ClientForm c={c} />
              </details>
            </Card>
          ) : null}

          {can(user, "admin") ? (
            <form action={deleteClient} className="a-right">
              <input type="hidden" name="id" value={c.id} />
              <ConfirmSubmit className="a-btn a-btn--ghost-danger" confirm="Delete client, deals and invoices?">
                Delete client
              </ConfirmSubmit>
            </form>
          ) : null}
        </div>
      </div>
      {ds.length === 0 && inv.length === 0 && acts.length === 0 ? <Empty title="A fresh start">Add the first deal, log a call or set a follow-up.</Empty> : null}
    </>
  );
}
