import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing.ts";
import { LOCALE_LABELS, type AppLocale } from "@/data/locales.ts";
import { siteConfig } from "@/data/site-config.ts";
import { SiteHeader } from "@/components/layout/SiteHeader.tsx";
import { SiteFooter } from "@/components/layout/SiteFooter.tsx";
import { BriefProvider } from "@/components/brief/BriefProvider.tsx";
import { PricingProvider } from "@/components/pricing/PricingProvider.tsx";
import { PreviewRibbon } from "@/components/layout/PreviewRibbon.tsx";
import { MotionBootstrap } from "@/components/motion/MotionBootstrap.tsx";
import { MotionDirector } from "@/components/motion/MotionDirector.tsx";
import { Cursor } from "@/components/motion/Cursor.tsx";
import { Tracker } from "@/components/analytics/Tracker.tsx";
import { ContactProvider } from "@/components/site/ContactProvider.tsx";
import { getSiteContact } from "@/lib/server/site-settings.ts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t("defaultTitle"), template: `%s | ${siteConfig.name}` },
    description: t("defaultDescription"),
    applicationName: siteConfig.name,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060D0C" },
    { media: "(prefers-color-scheme: light)", color: "#EEEEE9" },
  ],
  colorScheme: "dark light",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  // Per-request CSP nonce set by proxy.ts (pages are rendered per request for this reason).
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const { securityEmail: _s, ...publicContact } = getSiteContact();

  return (
    <html lang={LOCALE_LABELS[locale as AppLocale].htmlLang} suppressHydrationWarning>
      <head>
        <MotionBootstrap nonce={nonce} />
        <link rel="preload" href="/fonts/inter-tight-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {locale === "ru" ? (
          <link rel="preload" href="/fonts/inter-tight-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        ) : null}
        {locale === "hy" ? (
          <link rel="preload" href="/fonts/noto-sans-armenian-armenian-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        ) : null}
      </head>
      <body>
        <MotionDirector />
        <Tracker />
        <Cursor />
        <ContactProvider value={publicContact}>
        <NextIntlClientProvider>
          <PricingProvider>
            <BriefProvider>
              <SiteHeader />
              <main id="main" tabIndex={-1}>
                {children}
              </main>
              <SiteFooter />
              <PreviewRibbon />
            </BriefProvider>
          </PricingProvider>
        </NextIntlClientProvider>
        </ContactProvider>
      </body>
    </html>
  );
}
