import Link from "next/link";
import { requireUser, can } from "@/lib/server/auth.ts";
import { clientOptions, tasks } from "@/lib/server/admin-data.ts";
import { Badge, Card, Empty, PageHead, Tabs, date, inDays, todayIso } from "@/components/admin/ui.tsx";
import { ConfirmSubmit, Submit } from "@/components/admin/forms.tsx";
import { createTask, deleteTask, toggleTask } from "../../actions.ts";

export const metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const user = await requireUser("viewer");
  const sp = await searchParams;
  const show = sp.show === "done" ? "done" : sp.show === "all" ? "all" : "open";
  const all = tasks();
  const rows = show === "open" ? all.filter((t) => !t.done) : show === "done" ? all.filter((t) => t.done) : all;
  const today = todayIso();
  const groups = [
    { title: "Overdue", rows: rows.filter((t) => !t.done && t.due_date && t.due_date < today) },
    { title: "Today", rows: rows.filter((t) => !t.done && t.due_date === today) },
    { title: "Upcoming", rows: rows.filter((t) => !t.done && t.due_date && t.due_date > today) },
    { title: "No date", rows: rows.filter((t) => !t.done && !t.due_date) },
    { title: "Done", rows: rows.filter((t) => t.done) },
  ].filter((g) => g.rows.length);
  const clients = clientOptions();
  const editable = can(user, "manager");

  return (
    <>
      <PageHead title="Tasks" sub="Follow-ups for clients and briefs." actions={<Tabs current={show} items={[{ key: "open", label: "Open", href: "/admin/tasks" }, { key: "done", label: "Done", href: "/admin/tasks?show=done" }, { key: "all", label: "All", href: "/admin/tasks?show=all" }]} />} />
      {editable ? (
        <Card>
          <form action={createTask} className="a-form a-form--row">
            <input name="title" required maxLength={200} placeholder="What needs doing?" className="a-grow" aria-label="Task" />
            <select name="clientId" className="a-select" aria-label="Client" defaultValue="">
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input type="date" name="dueDate" defaultValue={inDays(1)} aria-label="Due date" />
            <select name="priority" className="a-select" aria-label="Priority" defaultValue="normal">
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <Submit>Add task</Submit>
          </form>
        </Card>
      ) : null}
      {groups.length ? (
        groups.map((g) => (
          <Card key={g.title} title={`${g.title} · ${g.rows.length}`} pad={false}>
            <ul className="a-list">
              {g.rows.map((t) => (
                <li key={t.id} className={`a-list__row${t.done ? " is-done" : ""}`}>
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className={`a-check${t.done ? " is-checked" : ""}`} aria-label={t.done ? "Mark not done" : "Mark done"} disabled={!editable} />
                  </form>
                  <span className="a-list__main">
                    <b>{t.title}</b>
                    <small>
                      {t.client_id ? (
                        <Link href={`/admin/clients/${t.client_id}`} className="a-link">
                          {t.client_name}
                        </Link>
                      ) : t.lead_id ? (
                        <Link href={`/admin/leads/${t.lead_id}`} className="a-link">
                          Brief #{t.lead_id}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </small>
                  </span>
                  <span className="a-list__side">
                    <small className={!t.done && t.due_date && t.due_date < today ? "a-overdue" : "a-muted"}>{date(t.due_date)}</small>
                    <Badge value={t.priority} />
                    {editable ? (
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={t.id} />
                        <ConfirmSubmit className="a-iconbtn a-iconbtn--danger" confirm="Delete?">
                          ×
                        </ConfirmSubmit>
                      </form>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))
      ) : (
        <Card>
          <Empty title="All clear">No tasks here.</Empty>
        </Card>
      )}
    </>
  );
}
