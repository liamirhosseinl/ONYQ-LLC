import type { ReactNode } from "react";
import { requireUser } from "@/lib/server/auth.ts";
import { get } from "@/lib/server/db.ts";
import { Shell } from "@/components/admin/shell.tsx";
import { logout } from "../actions.ts";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("viewer");
  const newLeads = get<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE status = 'new'")!.n;
  const openTasks = get<{ n: number }>("SELECT COUNT(*) AS n FROM tasks WHERE done = 0 AND due_date IS NOT NULL AND due_date <= date('now')")!.n;
  return (
    <Shell
      user={user}
      newLeads={newLeads}
      openTasks={openTasks}
      signOut={
        <form action={logout}>
          <button type="submit" className="a-iconbtn" aria-label="Sign out" title="Sign out">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
              <path d="M10 3H13v10h-3M7 11l3-3-3-3M10 8H2" />
            </svg>
          </button>
        </form>
      }
    >
      {children}
    </Shell>
  );
}
