"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import { Link } from "@/i18n/navigation.ts";
import { ArrowUpRight } from "@/components/ui/icons.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { motionAllowed } from "@/components/motion/motion-env.ts";

gsap.registerPlugin(ScrollTrigger);

export interface WorkItem {
  slug: string;
  name: string;
  industry: string;
  teaser: string;
  tags: string[];
  year: number;
  metric: string | null;
  metricLabel: string;
  accent: string;
  cover: { src: string; width: number; height: number; alt: string; cutout?: boolean };
}

/**
 * Selected work as an expanding panel row: one project is open (cover, story, metric),
 * the others are slim spines with their number and name. On wide screens the section pins
 * and scrolling opens the projects one after another; hovering, focusing or clicking a spine
 * opens it directly. Small screens (and reduced motion) get a plain list of open cards.
 */
export function WorkAccordion({ items, view }: { items: WorkItem[]; view: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [wide, setWide] = useState(false);
  const n = items.length;

  useEffect(() => {
    const el = root.current;
    const mq = window.matchMedia("(min-width: 901px)");
    const onWide = () => setWide(mq.matches);
    onWide();
    mq.addEventListener("change", onWide);
    if (!el || !motionAllowed()) return () => mq.removeEventListener("change", onWide);
    let st: ScrollTrigger | null = null;
    const setup = () => {
      st?.kill();
      st = null;
      setPinned(mq.matches);
      if (!mq.matches) return;
      requestAnimationFrame(() => {
        st = ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          onUpdate(self) {
            el.style.setProperty("--wp", self.progress.toFixed(4));
            setActive(Math.min(n - 1, Math.floor(self.progress * n * 0.9999)));
          },
        });
        ScrollTrigger.refresh();
      });
    };
    setup();
    mq.addEventListener("change", setup);
    return () => {
      st?.kill();
      mq.removeEventListener("change", setup);
      mq.removeEventListener("change", onWide);
    };
  }, [n]);

  const open = (i: number) => {
    setActive(i);
    const el = root.current;
    if (!pinned || !el) return;
    // Keep scroll position in step with the chosen panel so scrolling continues from it.
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    const target = top + travel * ((i + 0.5) / n);
    if (Math.abs(window.scrollY - target) > 4 && el.getBoundingClientRect().top <= 1) window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <div ref={root} className="work-acc" data-pinned={pinned ? "true" : undefined} style={{ "--n": n } as CSSProperties}>
      <div className="work-acc__sticky">
        <ul role="list" className="work-acc__row">
          {items.map((it, i) => {
            const isOn = i === active;
            return (
              <li
                key={it.slug}
                className="work-acc__item"
                data-active={isOn ? "true" : "false"}
                style={{ "--accent": it.accent } as CSSProperties}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              >
                <button type="button" className="work-acc__spine" onClick={() => open(i)} aria-expanded={isOn} aria-controls={`work-${it.slug}`} tabIndex={isOn || !wide ? -1 : 0}>
                  <span className="work-acc__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="work-acc__spine-name">{it.name}</span>
                  <span className="work-acc__plus" aria-hidden="true" />
                </button>
                <article id={`work-${it.slug}`} className="work-acc__panel" aria-labelledby={`work-${it.slug}-title`} inert={wide && !isOn ? true : undefined}>
                  <div className={`work-acc__media${it.cover.cutout ? " work-acc__media--cutout" : ""}`}>
                    <Image src={it.cover.src} width={it.cover.width} height={it.cover.height} alt={it.cover.alt} sizes="(max-width: 900px) 100vw, 60vw" />
                  </div>
                  <div className="work-acc__shade" aria-hidden="true" />
                  <div className="work-acc__body">
                    <div className="work-acc__meta">
                      <span className="work-acc__num">{String(i + 1).padStart(2, "0")}</span>
                      <span>{it.industry}</span>
                      <span>{it.year}</span>
                    </div>
                    <h3 id={`work-${it.slug}-title`} className="work-acc__title">
                      {it.name}
                    </h3>
                    <p className="work-acc__teaser">{it.teaser}</p>
                    <div className="work-acc__foot">
                      <ul role="list" className="work-acc__tags">
                        {it.tags.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      {it.metric ? (
                        <p className="work-acc__metric">
                          <Spark className="work-acc__spark" />
                          <strong>{it.metric}</strong>
                          <span>{it.metricLabel}</span>
                        </p>
                      ) : null}
                      <Link href={`/portfolio/${it.slug}`} className="work-acc__cta">
                        {view} <ArrowUpRight />
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
        <div className="work-acc__progress" aria-hidden="true">
          {items.map((it, i) => (
            <span key={it.slug} data-on={i <= active ? "true" : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
