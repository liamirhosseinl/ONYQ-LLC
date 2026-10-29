import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { DIRECTION_SLUGS, footerPopular } from "@/data/navigation.ts";
import { siteConfig } from "@/data/site-config.ts";
import { phoneList, telHref } from "@/lib/contact.ts";
import { getSiteContact } from "@/lib/server/site-settings.ts";
import { getCatalogueCopy } from "@/content/catalogue.ts";
import { OpenBriefButton } from "@/components/brief/OpenBriefButton.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";
import { Spark, Wordmark } from "@/components/ui/Wordmark.tsx";
import {
  Scene,
  SceneGlow,
  SceneLights,
  SceneMotes,
  SceneSpark,
  SceneStars,
} from "@/components/art/Scene.tsx";
import { SplitLines } from "@/components/motion/Split.tsx";
import { BackToTop } from "./BackToTop.tsx";

const POPULAR_TO_SERVICE = {
  "landing-page": "landing-page",
  "corporate-website": "corporate-website",
  "online-store": "online-store",
  seo: "seo",
  "telegram-bot": "telegram-bot",
  "ai-assistant": "ai-assistant",
} as const;

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tA = await getTranslations("a11y");
  const locale = await getLocale();
  const copy = getCatalogueCopy(locale);
  const contact = getSiteContact();
  const c = contact;
  const hasContact = Boolean(
    c.salesEmail ||
    c.telegram ||
    c.whatsapp ||
    c.phone ||
    contact.social.length,
  );
  const legal = [
    siteConfig.legal.privacyPolicy && {
      href: "/privacy-policy",
      label: siteConfig.legal.privacyPolicy.title,
    },
    siteConfig.legal.terms && {
      href: "/terms",
      label: siteConfig.legal.terms.title,
    },
    siteConfig.legal.cancellation && {
      href: "/cancellation",
      label: siteConfig.legal.cancellation.title,
    },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="site-footer">
      <section className="footer-scene" aria-labelledby="footer-title">
        <Scene
          name="footer"
          ratio={2.755}
          cover={2.3}
          focus={[0.3, 1]}
          focusMobile={[0.04, 1]}
          className="footer-scene__picture"
        >
          <SceneStars count={42} seed={21} area={[30, 2, 100, 32]} />
          <SceneGlow x={90.6} y={30.7} size={10} tone="moon" only="night" />
          <SceneGlow x={94} y={46} size={20} tone="sun" only="day" />
          <SceneLights count={30} seed={31} area={[30, 58, 96, 70]} />
          <SceneMotes count={16} seed={41} area={[2, 62, 98, 96]} />
          <SceneSpark x={13.2} y={50} size={3} />
        </Scene>
        <div className="footer-scene__shade" aria-hidden="true" />
        <div className="wrap footer-scene__inner">
          <p className="eyebrow footer-scene__eyebrow" data-reveal="up">
            <Spark className="eyebrow__spark" />
            {t("tagline")}
          </p>
          <h2 id="footer-title" className="t-giant footer-scene__title">
            <SplitLines lines={[t("headline1"), t("headline2")]} />
          </h2>
          <p className="footer-scene__lead" data-reveal="up">
            {t("lead")}
          </p>
          <div className="footer-scene__cta" data-reveal="up">
            <OpenBriefButton className="btn btn--primary btn--large" magnetic>
              {t("startBrief")} <ArrowUpRight />
            </OpenBriefButton>
          </div>
        </div>
      </section>

      <div className="wrap footer-grid">
        <div className="footer-col footer-col--brand">
          <Link
            href="/"
            aria-label={tA("home")}
            className="footer-logo site-footer__brand"
          >
            <Wordmark />
          </Link>
          <p className="footer-tagline">{t("tagline")}</p>
          <p className="t-small">{t("registered")}</p>
          {siteConfig.legalName ? (
            <p className="t-small">{siteConfig.legalName}</p>
          ) : null}
          {siteConfig.taxId ? (
            <p className="t-small">
              {t("tin")}: {siteConfig.taxId}
            </p>
          ) : null}
        </div>

        <nav className="footer-col" aria-label={t("studio")}>
          <p className="footer-col__title">{t("studio")}</p>
          <ul role="list">
            <li>
              <Link href="/about">{tNav("items.about")}</Link>
            </li>
            <li>
              <Link href="/how-we-work">{tNav("items.howWeWork")}</Link>
            </li>
            <li>
              <Link href="/portfolio">{tNav("items.portfolio")}</Link>
            </li>
            <li>
              <Link href="/price">{tNav("pricing")}</Link>
            </li>
            <li>
              <Link href="/faq">{tNav("items.faq")}</Link>
            </li>
            <li>
              <Link href="/contacts">{tNav("items.contacts")}</Link>
            </li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label={t("services")}>
          <p className="footer-col__title">{t("services")}</p>
          <ul role="list">
            {DIRECTION_SLUGS.map((slug) => (
              <li key={slug}>
                <Link href={`/${slug}`}>{tNav(`items.${slug}`)}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label={t("popular")}>
          <p className="footer-col__title">{t("popular")}</p>
          <ul role="list">
            {footerPopular.map((slug) => (
              <li key={slug}>
                <Link href={`/services/${slug}`}>
                  {copy.serviceCopy[POPULAR_TO_SERVICE[slug]].name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {hasContact || legal.length ? (
          <div className="footer-col">
            {hasContact ? (
              <p className="footer-col__title">{t("contact")}</p>
            ) : null}
            <ul role="list">
              {c.salesEmail ? (
                <li>
                  <a href={`mailto:${c.salesEmail}`}>{c.salesEmail}</a>
                </li>
              ) : null}
              {c.telegram ? (
                <li>
                  <a
                    href={`https://t.me/${c.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Telegram · @{c.telegram}
                    <span className="sr-only"> ({tA("opensInNewTab")})</span>
                  </a>
                </li>
              ) : null}
              {c.whatsapp ? (
                <li>
                  <a
                    href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                    <span className="sr-only"> ({tA("opensInNewTab")})</span>
                  </a>
                </li>
              ) : null}
              {phoneList(c.phone).map((ph) => (
                <li key={ph}>
                  <a href={telHref(ph)}>{ph}</a>
                </li>
              ))}
              {contact.social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                    <span className="sr-only"> ({tA("opensInNewTab")})</span>
                  </a>
                </li>
              ))}
            </ul>
            {legal.length ? (
              <>
                <p className="footer-col__title footer-col__title--spaced">
                  {t("legal")}
                </p>
                <ul role="list">
                  {legal.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="wrap footer-bar">
        <p className="t-small">
          {t("rights", { year: new Date().getFullYear() })}
        </p>
        <BackToTop label={t("backToTop")} />
      </div>
    </footer>
  );
}
