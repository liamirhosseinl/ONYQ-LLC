import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContent } from "@/content/index.ts";
import { getSiteContact } from "@/lib/server/site-settings.ts";
import { pageMetadata } from "@/lib/metadata.ts";
import { PageHero } from "@/components/page/PageBlocks.tsx";
import { BriefFlow } from "@/components/brief/BriefFlow.tsx";
import { siteConfig } from "@/data/site-config.ts";
import { phoneList, telHref } from "@/lib/contact.ts";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { contactsPage } = getContent(locale);
  return pageMetadata({ title: contactsPage.meta.title, description: contactsPage.meta.description, path: "/contacts", locale });
}

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { contactsPage } = getContent(locale);
  const tp = await getTranslations("pages");
  const tf = await getTranslations("footer");
  const tb = await getTranslations("brief");
  const c = getSiteContact();

  return (
    <>
      <PageHero crumbs={[{ label: tp("home"), href: "/" }, { label: tp("contactCrumb") }]} title={contactsPage.title} lead={contactsPage.lead} actions={false} />
      <section className="section section--tight" aria-label={tb("dialogLabel")}>
        <div className="wrap contact-layout">
          <div data-reveal="up">
            <BriefFlow variant="page" />
          </div>

          <div data-reveal="up" style={{ ["--reveal-delay" as string]: "140ms" }}>
            <h2 className="t-h3">{contactsPage.channelsTitle}</h2>
            {c.salesEmail || c.telegram || c.whatsapp || c.phone ? (
              <ul role="list" className="contact-channels">
                {c.salesEmail ? (
                  <li>
                    <span className="mono">{tp("email")}</span>
                    <a href={`mailto:${c.salesEmail}`}>{c.salesEmail}</a>
                  </li>
                ) : null}
                {c.telegram ? (
                  <li>
                    <span className="mono">Telegram</span>
                    <a href={`https://t.me/${c.telegram}`} target="_blank" rel="noopener noreferrer">
                      @{c.telegram}
                    </a>
                  </li>
                ) : null}
                {c.whatsapp ? (
                  <li>
                    <span className="mono">WhatsApp</span>
                    <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      {c.whatsapp}
                    </a>
                  </li>
                ) : null}
                {phoneList(c.phone).map((ph) => (
                  <li key={ph}>
                    <span className="mono">{tp("phone")}</span>
                    <a href={telHref(ph)}>{ph}</a>
                  </li>
                ))}
                {siteConfig.taxId ? (
                  <li>
                    <span className="mono">{tf("tin")}</span>
                    <span>{siteConfig.taxId}</span>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="contact-note">{contactsPage.channelsPending}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
