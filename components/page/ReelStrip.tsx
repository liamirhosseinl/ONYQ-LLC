import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { getCase } from "@/data/cases.ts";
import { getContent } from "@/content/index.ts";
import { Split } from "@/components/motion/Split.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";

/** Real short-form edits (Amir Khaldari case) shown on the Content & video page. */
export async function ReelStrip() {
  const locale = await getLocale();
  const tp = await getTranslations("pages");
  const tw = await getTranslations("work");
  const study = getCase("amir-khaldari");
  if (!study) return null;
  const copy = getContent(locale).cases[study.slug];
  const reels = study.gallery.filter((g) => g.video).slice(0, 4);
  return (
    <section className="section reel-strip" aria-labelledby="reel-strip-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="reel-strip-title" className="t-h3">
            <Split text={tp("selectedEdits")} />
          </h2>
          <Link href={`/portfolio/${study.slug}`} className="link-arrow">
            {copy.name} · {tw("view")} <ArrowUpRight />
          </Link>
        </div>
        <ul role="list" className="reel-strip__list" data-reveal-stagger>
          {reels.map((r) => (
            <li key={r.src}>
              <video src={r.video} poster={r.src} muted loop playsInline autoPlay preload="none" aria-label={copy.alts[r.alt]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
