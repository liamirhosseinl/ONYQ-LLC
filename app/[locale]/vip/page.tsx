import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata.ts";
import { VipLounge } from "@/components/vip/VipLounge.tsx";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vip" });
  return {
    ...pageMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/vip", locale }),
    // An invitation-only lounge: reachable from the menu, kept out of search results.
    robots: { index: false, follow: true },
  };
}

export default async function VipPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VipLounge />;
}
