import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing.ts";
import { getMessages } from "@/lib/server/content.ts";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const base = (await import(`../messages/${locale}.json`)).default as Record<string, unknown>;

  return {
    locale,
    timeZone: "Asia/Yerevan",
    // Interface strings edited in Admin → Content are merged over the code defaults.
    messages: (await getMessages(locale, base)) as typeof base,
  };
});
