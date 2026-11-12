import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireUser, can } from "@/lib/server/auth.ts";
import { docList, docStatuses, effective, pendingDrafts, type CaseEntry } from "@/lib/server/cms-admin.ts";
import { CMS_LOCALES, GLOBAL, GROUP_LABEL, STRUCTURE_DOCS, type DocGroup } from "@/lib/cms/registry.ts";
import { Card, PageHead, ago } from "@/components/admin/ui.tsx";
import { Submit } from "@/components/admin/forms.tsx";
import { publishEverything } from "../../cms-actions.ts";

export const metadata = { title: "Content" };

function Dot({ state }: { state: "draft" | "edited" | "default" }) {
  const label = state === "draft" ? "Unpublished draft" : state === "edited" ? "Edited and published" : "Original text";
  return <span className={`a-cms-dot a-cms-dot--${state}`} title={label} aria-label={label} />;
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ published?: string }> }) {
  const user = await requireUser("viewer");
  const sp = await searchParams;
  const docs = docList();
  const statuses = docStatuses();
  const pending = pendingDrafts();
  const labelOf = new Map(docs.map((d) => [d.key, d.label]));
  labelOf.set("services", STRUCTURE_DOCS.services.label);
  labelOf.set("cases", STRUCTURE_DOCS.cases.label);
  const groups = Object.keys(GROUP_LABEL) as DocGroup[];
  const state = (key: string, locale: string) => {
    const s = statuses.get(`${key}|${locale}`);
    return s?.draft ? "draft" : s?.published ? "edited" : "default";
  };
  const casesCount = effective<CaseEntry[]>("cases", GLOBAL, "draft").length;

  async function publishAllAction() {
    "use server";
    await publishEverything();
    revalidatePath("/admin/content");
  }

  return (
    <>
      <PageHead
        title="Website content"
        sub="Edit every text, price, project and image on onyq.am. Changes are saved as drafts; you see them in preview, and visitors see them after you publish."
        actions={
          <>
            <a className="a-btn" href="/admin/preview?mode=on&next=/" target="_blank" rel="noopener">
              Preview drafts on the site
            </a>
            {can(user, "admin") && pending.length ? (
              <form action={publishAllAction}>
                <Submit>Publish all drafts ({pending.length})</Submit>
              </form>
            ) : null}
          </>
        }
      />
      {sp.published ? <p className="a-msg a-msg--ok">Published.</p> : null}

      <div className="a-grid a-grid--3 a-cms-quick">
        <Link href="/admin/content/services" className="a-cms-tile">
          <b>Services &amp; prices</b>
          <span>Prices, timelines, categories, add or hide a service</span>
          <Dot state={state("services", GLOBAL)} />
        </Link>
        <Link href="/admin/content/cases" className="a-cms-tile">
          <b>Portfolio projects</b>
          <span>{casesCount} projects — order, images, links, add a new one</span>
          <Dot state={state("cases", GLOBAL)} />
        </Link>
        <Link href="/admin/content/media" className="a-cms-tile">
          <b>Media library</b>
          <span>Upload images and videos for the portfolio</span>
        </Link>
      </div>

      {pending.length ? (
        <Card title={`Waiting to be published (${pending.length})`}>
          <ul className="a-cms-pending">
            {pending.map((p) => (
              <li key={`${p.key}|${p.locale}`}>
                <Link
                  className="a-link"
                  href={
                    p.key === "services"
                      ? "/admin/content/services"
                      : p.key === "cases"
                        ? "/admin/content/cases"
                        : `/admin/content/edit?doc=${encodeURIComponent(p.key)}&lang=${p.locale}`
                  }
                >
                  {labelOf.get(p.key) ?? p.key}
                </Link>
                {p.locale !== GLOBAL ? <span className="a-chip">{p.locale.toUpperCase()}</span> : null}
                <small className="a-muted">
                  {p.name ?? "someone"} · {ago(p.draft_updated_at)}
                </small>
              </li>
            ))}
          </ul>
          {!can(user, "admin") ? <p className="a-muted a-small">An admin publishes drafts.</p> : null}
        </Card>
      ) : null}

      <p className="a-cms-key a-muted a-small">
        <Dot state="default" /> original text <Dot state="edited" /> edited and live <Dot state="draft" /> draft not published yet
      </p>

      {groups.map((g) => {
        const rows = docs.filter((d) => d.group === g);
        if (!rows.length) return null;
        return (
          <Card key={g} title={GROUP_LABEL[g]} pad={false}>
            <div className="a-tablewrap">
              <table className="a-table a-cms-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    {CMS_LOCALES.map((l) => (
                      <th key={l} className="a-center">
                        {l.toUpperCase()}
                      </th>
                    ))}
                    <th className="a-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.key}>
                      <td>
                        <Link href={`/admin/content/edit?doc=${encodeURIComponent(d.key)}&lang=en`} className="a-rowlink">
                          <span>
                            <b>{d.label}</b>
                            <small>{d.hint ?? d.path}</small>
                          </span>
                        </Link>
                      </td>
                      {CMS_LOCALES.map((l) => (
                        <td key={l} className="a-center">
                          <Link href={`/admin/content/edit?doc=${encodeURIComponent(d.key)}&lang=${l}`} aria-label={`${d.label} — ${l.toUpperCase()}`}>
                            <Dot state={state(d.key, l)} />
                          </Link>
                        </td>
                      ))}
                      <td className="a-right">
                        <Link href={`/admin/content/edit?doc=${encodeURIComponent(d.key)}&lang=en`} className="a-btn a-btn--small">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </>
  );
}
