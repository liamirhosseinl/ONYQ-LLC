import Link from "next/link";
import { requireUser } from "@/lib/server/auth.ts";
import { allMedia } from "@/lib/server/cms-admin.ts";
import { PageHead } from "@/components/admin/ui.tsx";
import { MediaLibrary } from "@/components/admin/cms/MediaLibrary.tsx";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  await requireUser("manager");
  const items = await allMedia();
  const uploads = items.filter((m) => !("builtIn" in m));
  return (
    <>
      <PageHead
        title="Media library"
        sub={
          <>
            <Link href="/admin/content" className="a-link">
              ← Content
            </Link>
            <span className="a-sep">·</span> {uploads.length} uploaded · {items.length - uploads.length} that ship with the site
          </>
        }
      />
      <MediaLibrary items={items} />
    </>
  );
}
