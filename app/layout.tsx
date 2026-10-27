import type { ReactNode } from "react";

// The real <html>/<body> live in app/[locale]/layout.tsx so the lang attribute follows the locale.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
