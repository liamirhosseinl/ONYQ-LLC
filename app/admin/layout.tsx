import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "ONYQ Admin", template: "%s · ONYQ Admin" },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060D0C" },
    { media: "(prefers-color-scheme: light)", color: "#EEEEE9" },
  ],
};

export const dynamic = "force-dynamic";

const THEME = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('onyq.theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.dataset.theme=t}catch(e){d.dataset.theme='dark'}})();`;

export default async function AdminRoot({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME }} />
        <link rel="preload" href="/fonts/inter-tight-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="a-body">{children}</body>
    </html>
  );
}
