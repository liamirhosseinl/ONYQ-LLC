import Link from "next/link";
import { requireUser, can } from "@/lib/server/auth.ts";
import { docState, type ServiceEntry } from "@/lib/server/cms-admin.ts";
import { GLOBAL } from "@/lib/cms/registry.ts";
import { categories } from "@/data/services.ts";
import { getCatalogueCopy } from "@/content/catalogue.ts";
import { PageHead, ago } from "@/components/admin/ui.tsx";
import { ServicesEditor } from "@/components/admin/cms/ServicesEditor.tsx";

export const metadata = { title: "Services & prices" };

export default async function ServicesAdminPage() {
  const user = await requireUser("viewer");
  const st = docState("services", GLOBAL);
  const names = (docState("catalogue", "en").draft as { serviceCopy: Record<string, { name: string; short: string }> }).serviceCopy;
  const codeCats = getCatalogueCopy("en").categoryCopy;
  const codeIds = new Set((st.defaults as unknown as ServiceEntry[]).map((s) => s.id));

  return (
    <>
      <PageHead
        title="Services & prices"
        sub={
          <>
            <Link href="/admin/content" className="a-link">
              ← Content
            </Link>
            <span className="a-sep">·</span> Prices are in US dollars; the site converts to AMD with the rate in Settings.
            {st.publishedAt ? (
              <>
                <span className="a-sep">·</span> last published {ago(st.publishedAt)}
              </>
            ) : null}
          </>
        }
      />
      <p className="a-muted a-small">
        Names and descriptions of services are edited in{" "}
        <Link className="a-link" href="/admin/content/edit?doc=catalogue&lang=en">
          Service names, descriptions &amp; categories
        </Link>
        . A hidden service disappears from the price list, the brief and the VIP lounge, but old briefs still show its name.
      </p>
      <ServicesEditor
        value={st.draft as unknown as ServiceEntry[]}
        hasDraft={st.hasDraft}
        names={names}
        categories={categories.map((c) => ({ id: c.id, label: codeCats[c.id].title }))}
        codeIds={[...codeIds]}
        canEdit={can(user, "manager")}
        canPublish={can(user, "admin")}
      />
    </>
  );
}
