import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TopicPage, topicMetadata } from "@/components/page/TopicPage.tsx";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return topicMetadata("ai", locale);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TopicPage slug="ai" />;
}
