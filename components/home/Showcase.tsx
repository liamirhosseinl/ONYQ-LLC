import type { CSSProperties } from "react";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { getContent } from "@/content/index.ts";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { formatNumber } from "@/lib/format.ts";

/**
 * "What we do" — one scene per discipline, built from ONYQ's own work wherever possible:
 * the Vihan School identity, the English Institute platform and the Eagle VPN app, the
 * Amir Khaldari edits. Only the AI assistant is a labelled concept. The active scene follows
 * the parent .story[data-stage] (styles/showcase.css).
 */
export async function Showcase() {
  const t = await getTranslations("mocks.showcase");
  const tc = await getTranslations("mocks.canvas");
  const locale = await getLocale();
  const { cases } = getContent(locale);
  const files = t.raw("intelligence.files") as string[];
  const flow = t.raw("intelligence.flow") as string[];
  const scope = t.raw("engineering.scope") as string[];
  const tracks = t.raw("content.tracks") as string[];
  const vihan = cases["vihan-school"].alts;
  const inst = cases["english-institute"].alts;
  const eagle = cases["eagle-vpn"].alts;

  return (
    <div className="showcase" aria-hidden="true">
      {/* Design — a real identity, laid out as a brand board */}
      <div className="showcase__scene showcase__scene--design">
        <div className="sc-bento">
          <figure className="sc-tile sc-tile--hero">
            <Image src="/work/vihan-school/02.webp" width={2000} height={1695} alt={vihan.symbol} sizes="420px" />
            <figcaption>
              <Spark />
              {t("design.label")}
            </figcaption>
          </figure>
          <figure className="sc-tile sc-tile--kit">
            <Image src="/work/vihan-school/04.webp" width={2000} height={1500} alt={vihan.stationery} sizes="260px" />
            <figcaption>{t("design.kit")}</figcaption>
          </figure>
          <div className="sc-tile sc-tile--palette">
            <p>{t("design.palette")}</p>
            {[
              ["#FFEED4", "Cream"],
              ["#F88032", "Orange"],
              ["#293335", "Charcoal"],
            ].map(([hex, name], i) => (
              <span key={hex} style={{ "--c": hex, "--k": i } as CSSProperties}>
                <i />
                <b>{name}</b>
                <em>{hex}</em>
              </span>
            ))}
          </div>
          <div className="sc-tile sc-tile--type">
            <p>{t("design.type")}</p>
            <strong>Aa</strong>
            <span>Vihan — Display / 72</span>
            <div className="sc-type__scale">
              <i style={{ "--w": "92%" } as CSSProperties} />
              <i style={{ "--w": "70%" } as CSSProperties} />
              <i style={{ "--w": "54%" } as CSSProperties} />
            </div>
          </div>
          <figure className="sc-tile sc-tile--pattern">
            <Image src="/work/vihan-school/10.webp" width={2000} height={667} alt={vihan.pattern} sizes="420px" />
          </figure>
        </div>
      </div>

      {/* Engineering — the English Institute platform and the Eagle VPN app */}
      <div className="showcase__scene showcase__scene--engineering">
        <div className="sc-eng">
          <figure className="sc-eng__laptop">
            <Image src="/work/english-institute/01.webp" width={2000} height={1500} alt={inst.dashboardLaptop} sizes="560px" />
          </figure>
          <figure className="sc-eng__phones">
            <Image src="/work/eagle-vpn/cut-01.webp" width={1403} height={1123} alt={eagle.screensLight} sizes="300px" />
          </figure>
          <div className="sc-chip sc-chip--label">
            <i />
            {t("engineering.label")}
          </div>
          <ul className="sc-eng__scope">
            {scope.map((s, i) => (
              <li key={s} style={{ "--k": i } as CSSProperties}>
                <span>✓</span>
                {s}
              </li>
            ))}
          </ul>
          <div className="sc-stat sc-stat--a">
            <b>80%</b>
            <span>{t("engineering.metric")}</span>
          </div>
          <div className="sc-stat sc-stat--b">
            <b>{formatNumber(10000, locale)}+</b>
            <span>
              {t("engineering.app")} · {t("engineering.installs")}
            </span>
          </div>
        </div>
      </div>

      {/* Intelligence — an assistant that answers from the company's own sources (concept) */}
      <div className="showcase__scene showcase__scene--intelligence">
        <div className="sc-ai">
          <div className="sc-ai__chat">
            <div className="sc-ai__head">
              <span className="sc-ai__avatar">
                <Spark />
              </span>
              <b>{t("intelligence.label")}</b>
              <em className="sc-ai__online" />
            </div>
            <p className="sc-msg sc-msg--q">{tc("q1")}</p>
            <div className="sc-msg sc-msg--a">
              {tc("a1")}
              <span className="sc-msg__src">
                <i />
                {files[0]}
              </span>
            </div>
            <p className="sc-msg sc-msg--q sc-msg--q2">{tc("q2")}</p>
            <div className="sc-msg sc-msg--a sc-msg--a2">
              {tc("a2")}
              <span className="sc-msg__handoff">{tc("joined")}</span>
            </div>
            <p className="sc-ai__typing">
              <i />
              <i />
              <i />
              {t("intelligence.typing")}
            </p>
          </div>
          <div className="sc-ai__side">
            <div className="sc-ai__sources">
              <p>{t("intelligence.sources")}</p>
              {files.map((f, i) => (
                <span key={f} data-on={i === 0 ? "true" : undefined}>
                  <i />
                  {f}
                </span>
              ))}
            </div>
            <ol className="sc-ai__flow">
              {flow.map((f, i) => (
                <li key={f} style={{ "--k": i } as CSSProperties}>
                  {f}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Content — a real edit playing, with its timeline */}
      <div className="showcase__scene showcase__scene--content">
        <div className="sc-edit">
          <div className="sc-edit__phone">
            <video src="/work/amir-khaldari/hormozi.mp4" poster="/work/amir-khaldari/hormozi.webp" muted loop playsInline autoPlay preload="none" />
            <span className="sc-edit__rec">
              <i />
              {t("content.hook")}
            </span>
          </div>
          <div className="sc-edit__panel">
            <p className="sc-edit__label">{t("content.label")}</p>
            <div className="sc-edit__timeline">
              <span className="sc-edit__playhead" />
              <div className="sc-edit__ruler">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i}>0:{String(i * 2).padStart(2, "0")}</span>
                ))}
              </div>
              <div className="sc-track sc-track--video">
                <em>{tracks[0]}</em>
                {[18, 9, 14, 7, 12, 20, 10].map((w, i) => (
                  <i key={i} style={{ "--w": w, "--k": i } as CSSProperties} />
                ))}
              </div>
              <div className="sc-track sc-track--captions">
                <em>{tracks[1]}</em>
                {[8, 6, 10, 5, 9, 7, 11, 6].map((w, i) => (
                  <i key={i} style={{ "--w": w, "--k": i } as CSSProperties} />
                ))}
              </div>
              <div className="sc-track sc-track--sound">
                <em>{tracks[2]}</em>
                <svg viewBox="0 0 300 30" preserveAspectRatio="none">
                  {Array.from({ length: 75 }, (_, i) => {
                    const h = 4 + Math.abs(Math.sin(i * 0.7) * 11 + Math.sin(i * 2.3) * 7);
                    return <rect key={i} x={i * 4} y={15 - h / 2} width="2.2" height={h} rx="1" />;
                  })}
                </svg>
              </div>
            </div>
            <div className="sc-edit__stats">
              <span>
                <Spark />
                {t("content.retention")}
              </span>
              <span>
                <Spark />
                {t("content.views")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
