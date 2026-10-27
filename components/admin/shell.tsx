"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const NAV: { href: string; label: string; icon: ReactNode; group?: string }[] = [
  { href: "/admin", label: "Overview", icon: <Icon d="M2 9l6-6 6 6M4 7.5V14h8V7.5" /> },
  { href: "/admin/analytics", label: "Analytics", icon: <Icon d="M2 13h12M4 11V7M7 11V4M10 11V8M13 11V5" /> },
  { href: "/admin/leads", label: "Inbox", icon: <Icon d="M2 4h12v8H2zM2 9h3.5l1 1.5h3l1-1.5H14" />, group: "Customers" },
  { href: "/admin/clients", label: "Clients", icon: <Icon d="M5.5 7a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4zM1.5 13.5c.4-2.4 2-3.6 4-3.6s3.6 1.2 4 3.6M11 3.2a2 2 0 0 1 0 3.8M12.2 9.9c1.3.4 2.1 1.6 2.3 3.6" /> },
  { href: "/admin/pipeline", label: "Pipeline", icon: <Icon d="M2 3h12l-4.5 5.2V13l-3-1.5V8.2z" /> },
  { href: "/admin/tasks", label: "Tasks", icon: <Icon d="M3 4.5l1.5 1.5L7 3.5M3 10.5l1.5 1.5L7 9.5M9 5h5M9 11h5" /> },
  { href: "/admin/finance", label: "Finance", icon: <Icon d="M2 4h12v8H2zM2 6.5h12M5 10h2" />, group: "Business" },
  { href: "/admin/settings", label: "Settings", icon: <Icon d="M8 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />, group: "System" },
  { href: "/admin/audit", label: "Audit log", icon: <Icon d="M4 2h6l3 3v9H4zM10 2v3h3M6 8h5M6 10.5h5" /> },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Shell({ user, newLeads, openTasks, children, signOut }: { user: { name: string; email: string; role: string }; newLeads: number; openTasks: number; children: ReactNode; signOut: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const badge = (href: string) => (href === "/admin/leads" ? newLeads : href === "/admin/tasks" ? openTasks : 0);

  return (
    <div className="a-shell" data-nav={open ? "open" : "closed"}>
      <aside className="a-side" aria-label="Admin navigation">
        <div className="a-side__brand">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="a-side__mark">
            <path
              fillRule="evenodd"
              d="M73.722 82.207 L88.536 97.021 Q89.950 98.435 91.364 97.021 L97.021 91.364 Q98.435 89.950 97.021 88.536 L82.207 73.722 A40 40 0 1 0 73.722 82.207 Z M50 24 C51.6 41 59 48.4 76 50 C59 51.6 51.6 59 50 76 C48.4 59 41 51.6 24 50 C41 48.4 48.4 41 50 24 Z"
            />
            <path className="a-side__spark" d="M50 24 C51.6 41 59 48.4 76 50 C59 51.6 51.6 59 50 76 C48.4 59 41 51.6 24 50 C41 48.4 48.4 41 50 24 Z" />
          </svg>
          <span>
            onyq <em>admin</em>
          </span>
        </div>
        <nav className="a-nav">
          {NAV.map((n) => (
            <div key={n.href}>
              {n.group ? <p className="a-nav__group">{n.group}</p> : null}
              <Link href={n.href} className="a-nav__link" aria-current={active(n.href) ? "page" : undefined}>
                {n.icon}
                <span>{n.label}</span>
                {badge(n.href) ? <span className="a-nav__badge">{badge(n.href)}</span> : null}
              </Link>
            </div>
          ))}
        </nav>
        <div className="a-side__foot">
          <a href="/" className="a-nav__link" target="_blank" rel="noopener">
            <Icon d="M9 2h5v5M14 2L7 9M12 9.5V14H2V4h4.5" />
            <span>View website</span>
          </a>
          <div className="a-user">
            <span className="a-user__avatar" aria-hidden="true">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="a-user__text">
              <b>{user.name}</b>
              <small>{user.role}</small>
            </span>
            {signOut}
          </div>
        </div>
      </aside>
      <div className="a-main">
        <div className="a-topbar">
          <button type="button" className="a-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span />
            <span />
          </button>
          <form action="/admin/search" className="a-search" role="search">
            <Icon d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM14 14l-3.5-3.5" />
            <input name="q" placeholder="Search clients, briefs, invoices…" aria-label="Search" maxLength={80} />
          </form>
          <ThemeSwitch />
        </div>
        <main className="a-content">{children}</main>
      </div>
      <button type="button" className="a-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />
    </div>
  );
}

function ThemeSwitch() {
  const [theme, setTheme] = useState<string>("dark");
  useEffect(() => setTheme(document.documentElement.dataset.theme || "dark"), []);
  return (
    <button
      type="button"
      className="a-iconbtn"
      aria-label={theme === "dark" ? "Switch to day theme" : "Switch to night theme"}
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("onyq.theme", next);
        } catch {}
        setTheme(next);
      }}
    >
      {theme === "dark" ? <Icon d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" /> : <Icon d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />}
    </button>
  );
}
