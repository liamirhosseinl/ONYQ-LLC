import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, can } from "@/lib/server/auth.ts";
import { activities, lead, visitorJourney, LEAD_STATUSES } from "@/lib/server/admin-data.ts";
import { getCatalogueCopy } from "@/content/index.ts";
import { Badge, Card, PageHead, ago, country, dateTime, dur, inDays } from "@/components/admin/ui.tsx";
import { AutoSelect, ConfirmSubmit, Submit } from "@/components/admin/forms.tsx";
import { addActivity, convertLead, createTask, deleteLead, setLeadStatus } from "../../../actions.ts";

export const metadata = { title: "Brief" };

const LABELS: Record<string, string> = {
  website: "A website",
  store: "An online store",
  app: "An app or bot",
  ai: "AI or automation",
  marketing: "Marketing & growth",
  brand: "Brand & design",
  other: "Something else",
  "new-idea": "A new idea",
  "existing-product": "An existing product",
  process: "An internal process",
  "under-1k": "Under $1,000",
  "1k-5k": "$1,000–5,000",
  "5k-15k": "$5,000–15,000",
  "15k-plus": "$15,000+",
  "not-sure": "Not sure yet",
  asap: "As soon as possible",
  "1-3-months": "In 1–3 months",
  flexible: "Flexible",
};

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("viewer");
  const { id } = await params;
  const l = lead(Number(id));
  if (!l) notFound();
  const journey = l.visitor ? visitorJourney(l.visitor, l.created_at) : [];
  const acts = activities({ leadId: l.id });
  const services = getCatalogueCopy("en").serviceCopy as Record<string, { name: string }>;
  const editable = can(user, "manager");
  const first = journey[0];

  return (
    <>
      <PageHead
        title={l.name}
        sub={
          <>
            <Link href="/admin/leads" className="a-link">
              ← Inbox
            </Link>
            <span className="a-sep">·</span> received {ago(l.created_at)} <span className="a-sep">·</span> <Badge value={l.status} />
          </>
        }
        actions={
          editable ? (
            <>
              <form action={setLeadStatus}>
                <input type="hidden" name="id" value={l.id} />
                <AutoSelect name="status" value={l.status} label="Status" options={LEAD_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
              </form>
              <form action={convertLead}>
                <input type="hidden" name="id" value={l.id} />
                <Submit>{l.client_id ? "Open client" : "Convert to client"}</Submit>
              </form>
            </>
          ) : null
        }
      />

      <div className="a-grid a-grid--2-1">
        <div className="a-stack">
          <Card title="Request">
            <p className="a-quote">{l.challenge}</p>
            <dl className="a-dl">
              <div>
                <dt>Type</dt>
                <dd>{LABELS[l.challenge_type ?? ""] ?? l.challenge_type}</dd>
              </div>
              <div>
                <dt>Starting point</dt>
                <dd>{LABELS[l.stage ?? ""] ?? "—"}</dd>
              </div>
              <div>
                <dt>Areas</dt>
                <dd>{l.areas ? l.areas.split(",").join(", ") : "—"}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{l.budget ? LABELS[l.budget] : "—"}</dd>
              </div>
              <div>
                <dt>Timing</dt>
                <dd>{l.timing ? LABELS[l.timing] : "—"}</dd>
              </div>
              <div>
                <dt>Opened from</dt>
                <dd>{l.service_id ? (services[l.service_id]?.name ?? l.service_id) : "general brief"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Notes & activity">
            {editable ? (
              <form action={addActivity} className="a-form a-form--row">
                <input type="hidden" name="leadId" value={l.id} />
                <select name="kind" className="a-select" aria-label="Kind">
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="message">Message</option>
                  <option value="meeting">Meeting</option>
                </select>
                <input name="body" required maxLength={5000} placeholder="What happened?" className="a-grow" />
                <Submit>Add</Submit>
              </form>
            ) : null}
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
              <li>
                <span className="a-timeline__dot a-timeline__dot--system" />
                <p>Brief received from the website{l.page ? ` (${l.page})` : ""}.</p>
                <small>{dateTime(l.created_at)}</small>
              </li>
            </ul>
          </Card>
        </div>

        <div className="a-stack">
          <Card title="Contact">
            <dl className="a-dl a-dl--single">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${l.email}`} className="a-link">
                    {l.email}
                  </a>
                </dd>
              </div>
              {l.contact ? (
                <div>
                  <dt>Phone / messenger</dt>
                  <dd>{l.contact}</dd>
                </div>
              ) : null}
              {l.company ? (
                <div>
                  <dt>Company</dt>
                  <dd>{l.company}</dd>
                </div>
              ) : null}
              <div>
                <dt>Site language</dt>
                <dd>{(l.locale ?? "en").toUpperCase()}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Their visit before writing">
            {journey.length ? (
              <>
                <p className="a-muted a-small">
                  {first?.referrer ? `Came from ${first.referrer}` : "Came directly"} · {country(first?.country ?? null)} · {first?.device}
                </p>
                <ol className="a-journey">
                  {journey.map((j, i) => (
                    <li key={i}>
                      <span>{j.path}</span>
                      <small>{j.duration_ms ? dur(j.duration_ms) : "—"}</small>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="a-muted a-small">No visit data for this brief (privacy settings or an older brief).</p>
            )}
          </Card>

          {editable ? (
            <Card title="Follow-up">
              <form action={createTask} className="a-form">
                <input type="hidden" name="leadId" value={l.id} />
                {l.client_id ? <input type="hidden" name="clientId" value={l.client_id} /> : null}
                <input name="title" required maxLength={200} defaultValue={`Reply to ${l.name}`} aria-label="Task" />
                <div className="a-form__row">
                  <input type="date" name="dueDate" defaultValue={inDays(1)} aria-label="Due date" />
                  <select name="priority" className="a-select" defaultValue="high" aria-label="Priority">
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                  <Submit className="a-btn">Add task</Submit>
                </div>
              </form>
            </Card>
          ) : null}

          {can(user, "admin") ? (
            <form action={deleteLead} className="a-right">
              <input type="hidden" name="id" value={l.id} />
              <ConfirmSubmit className="a-btn a-btn--ghost-danger">Delete brief</ConfirmSubmit>
            </form>
          ) : null}
        </div>
      </div>
    </>
  );
}
