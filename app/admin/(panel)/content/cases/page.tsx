import Link from "next/link";
import { requireUser, can } from "@/lib/server/auth.ts";
import { allMedia, docState, effective, referenceOptions, type CaseEntry } from "@/lib/server/cms-admin.ts";
import { GLOBAL } from "@/lib/cms/registry.ts";
import { PageHead, ago } from "@/components/admin/ui.tsx";
import { CasesEditor } from "@/components/admin/cms/CasesEditor.tsx";

export const metadata = { title: "Portfolio" };

export default async function CasesAdminPage() {
  const user = await requireUser("viewer");
  const st = docState("cases", GLOBAL);
  const list = st.draft as unknown as CaseEntry[];
  const names = Object.fromEntries(list.map((c) => [c.slug, effective<{ name: string }>(`case:${c.slug}`, "en", "draft").name]));
  const codeSlugs = (st.defaults as unknown as CaseEntry[]).map((c) => c.slug);

  return (
    <>
      <PageHead
        title="Portfolio projects"
        sub={
          <>
            <Link href="/admin/content" className="a-link">
              ← Content
            </Link>
            <span className="a-sep">·</span> Order, visibility, images and links of every project. The texts of a project are edited per language (links on each project).
            {st.publishedAt ? (
              <>
                <span className="a-sep">·</span> last published {ago(st.publishedAt)}
              </>
            ) : null}
          </>
        }
      />
      <CasesEditor
        value={list}
        hasDraft={st.hasDraft}
        names={names}
        codeSlugs={codeSlugs}
        media={await allMedia()}
        services={referenceOptions().service}
        canEdit={can(user, "manager")}
        canPublish={can(user, "admin")}
      />
    </>
  );
}
