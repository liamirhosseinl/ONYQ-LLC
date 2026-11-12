import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, can } from "@/lib/server/auth.ts";
import { codeDefault, docList, docState, docStatuses, effective, referenceOptions, versions, type CaseEntry } from "@/lib/server/cms-admin.ts";
import { CMS_LOCALES, GLOBAL, LOCALE_LABEL, type CmsLocale } from "@/lib/cms/registry.ts";
import { PageHead, ago } from "@/components/admin/ui.tsx";
import { ContentEditor } from "@/components/admin/cms/ContentEditor.tsx";

export const metadata = { title: "Edit content" };

export default async function EditContentPage({ searchParams }: { searchParams: Promise<{ doc?: string; lang?: string }> }) {
  const user = await requireUser("viewer");
  const sp = await searchParams;
  const key = sp.doc ?? "";
  if (key === "services") redirect("/admin/content/services");
  if (key === "cases") redirect("/admin/content/cases");
  const info = docList().find((d) => d.key === key);
  if (!info) notFound();
  const lang = (CMS_LOCALES as readonly string[]).includes(sp.lang ?? "") ? (sp.lang as CmsLocale) : "en";
  if (codeDefault(key, lang) === undefined) notFound();

  const state = docState(key, lang);
  const en = lang === "en" ? null : docState(key, "en");
  // Portfolio texts: every image of the project gets an alt-text field, even a new one.
  if (key.startsWith("case:")) {
    const study = (effective("cases", GLOBAL, "draft") as unknown as CaseEntry[]).find((c) => `case:${c.slug}` === key);
    const altKeys = study ? [study.cover, study.feature, ...study.gallery].filter(Boolean).map((i) => i!.alt) : [];
    for (const s of en ? [state, en] : [state]) {
      const d = s.draft as { alts?: Record<string, string> };
      d.alts = { ...Object.fromEntries(altKeys.map((k) => [k, ""])), ...(d.alts ?? {}) };
    }
  }
  const statuses = docStatuses();
  const history = versions(key, lang);
  const sitePath = `${lang === "en" ? "" : `/${lang}`}${info.path === "/" && lang !== "en" ? "" : info.path}` || "/";

  return (
    <>
      <PageHead
        title={info.label}
        sub={
          <>
            <Link href="/admin/content" className="a-link">
              ← Content
            </Link>
            <span className="a-sep">·</span> appears on <code className="a-code">{info.path}</code>
            {state.publishedAt ? (
              <>
                <span className="a-sep">·</span> last published {ago(state.publishedAt)}
                {state.publishedBy ? ` by ${state.publishedBy}` : ""}
              </>
            ) : null}
          </>
        }
      />
      <nav className="a-cms-langs" aria-label="Language">
        {CMS_LOCALES.map((l) => {
          const s = statuses.get(`${key}|${l}`);
          return (
            <Link key={l} href={`/admin/content/edit?doc=${encodeURIComponent(key)}&lang=${l}`} aria-current={l === lang ? "page" : undefined} className="a-cms-lang">
              {LOCALE_LABEL[l]}
              {s?.draft ? <span className="a-cms-dot a-cms-dot--draft" aria-label="draft" /> : s?.published ? <span className="a-cms-dot a-cms-dot--edited" aria-label="edited" /> : null}
            </Link>
          );
        })}
      </nav>
      {info.hint ? <p className="a-muted a-small">{info.hint}</p> : null}
      <ContentEditor
        key={`${key}|${lang}`}
        docKey={key}
        locale={lang}
        sitePath={sitePath}
        defaults={state.defaults ?? null}
        value={state.draft}
        hasDraft={state.hasDraft}
        draftInfo={state.hasDraft && state.draftUpdatedAt ? `Draft saved ${ago(state.draftUpdatedAt)}${state.draftBy ? ` by ${state.draftBy}` : ""}` : null}
        en={en ? { value: en.draft, defaults: en.defaults ?? null } : null}
        basis={state.basis}
        canEdit={can(user, "manager")}
        canPublish={can(user, "admin")}
        references={referenceOptions()}
        history={history.map((h) => ({ id: h.id, when: ago(h.created_at), by: h.name ?? "—", note: h.note }))}
        messages={key.startsWith("messages:")}
      />
    </>
  );
}
