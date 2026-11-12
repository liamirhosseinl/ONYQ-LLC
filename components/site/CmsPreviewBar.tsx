"use client";

import { usePathname } from "next/navigation";

/**
 * Shown only to a signed-in editor in preview mode: the page is rendered with unpublished
 * drafts. Admin-only UI, so it is in English like the rest of the panel.
 */
export function CmsPreviewBar() {
  const path = usePathname() || "/";
  const next = encodeURIComponent(path);
  return (
    <div className="cms-preview-bar" role="status">
      <span className="cms-preview-bar__dot" aria-hidden="true" />
      <span>
        <b>Preview</b> — this page shows unpublished drafts. Visitors still see the published version.
      </span>
      <a href="/admin/content">Open editor</a>
      <a href={`/admin/preview?mode=off&next=${next}`}>Exit preview</a>
    </div>
  );
}
