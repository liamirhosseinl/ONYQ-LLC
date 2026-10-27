import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig, type LegalDocument } from "@/data/site-config.ts";
import { pageMetadata } from "@/lib/metadata.ts";
import { getTranslations } from "next-intl/server";
import { PageHero } from "./PageBlocks.tsx";

type LegalKey = keyof typeof siteConfig.legal;

const PATHS: Record<LegalKey, string> = {
  privacyPolicy: "/privacy-policy",
  terms: "/terms",
  cancellation: "/cancellation",
};

/**
 * Legal documents are published only when ONYQ supplies approved text in
 * data/site-config.ts → legal. Until then the route returns 404 and no link points to it,
 * so the site never shows invented legal assurances.
 */
export function legalMetadata(key: LegalKey, locale: string): Metadata {
  const doc = siteConfig.legal[key];
  if (!doc) return { robots: { index: false } };
  return pageMetadata({ title: doc.title, description: `${doc.title} — ${siteConfig.name}`, path: PATHS[key], locale });
}

export async function LegalPage({ docKey }: { docKey: LegalKey }) {
  const doc: LegalDocument | null = siteConfig.legal[docKey];
  if (!doc) notFound();
  const tp = await getTranslations("pages");
  return (
    <>
      <PageHero crumbs={[{ label: tp("home"), href: "/" }, { label: doc.title }]} title={doc.title} lead={tp("lastUpdated", { date: doc.updatedAt })} actions={false} />
      <section className="section section--tight">
        <div className="wrap legal-body">
          {doc.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>
    </>
  );
}
