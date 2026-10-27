import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { SparkStone } from "@/components/art/BrandArt.tsx";
import { Split } from "@/components/motion/Split.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="wrap not-found">
      <div className="not-found__row">
        <p className="not-found__code" aria-hidden="true">
          404
        </p>
        <div className="not-found__visual" aria-hidden="true">
          <SparkStone id="nf-stone" className="not-found__art" />
        </div>
      </div>
      <p className="eyebrow eyebrow--muted">{t("eyebrow")}</p>
      <h1 className="t-h1">
        <Split text={t("title")} />
      </h1>
      <p className="t-lead">{t("body")}</p>
      <div className="not-found__links">
        <Link href="/" className="btn btn--primary">
          {t("home")} <ArrowUpRight />
        </Link>
        <Link href="/services" className="btn btn--ghost">
          {t("services")}
        </Link>
        <Link href="/price" className="btn btn--ghost">
          {t("pricing")}
        </Link>
      </div>
    </section>
  );
}
