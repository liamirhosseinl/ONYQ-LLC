"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { markMotionReady, motionAllowed } from "./motion-env.ts";

gsap.registerPlugin(ScrollTrigger);

export interface StoryTab {
  key: string;
  label: string;
}

/**
 * Pinned, scroll-led story (reference pattern: tall section + sticky stage, numbered tabs
 * with progress lines). All stage panels are server-rendered; this component only maps
 * scroll progress to `data-stage` and `--p` so CSS can transition text and visuals.
 *
 * Without JS, or with prefers-reduced-motion, the section stays in normal flow and every
 * panel is readable one after another.
 */
export function ScrollStory({
  id,
  label,
  className = "",
  head,
  panels,
  visual,
  tabs,
  scrollHint,
  foot,
}: {
  id: string;
  label: string;
  className?: string;
  head: ReactNode;
  panels: ReactNode[];
  visual: ReactNode;
  tabs: StoryTab[];
  scrollHint?: string;
  foot?: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const n = panels.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    markMotionReady();
    if (!motionAllowed()) return;
    setEnhanced(true);

    let current = -1;
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate(self) {
        const p = self.progress;
        section.style.setProperty("--p", p.toFixed(4));
        const s = Math.min(n - 1, Math.floor(p * n * 0.9999));
        if (s !== current) {
          current = s;
          section.dataset.stage = String(s);
          setStage(s);
        }
      },
    });
    // Layout height changes once data-enhanced applies.
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => st.kill();
  }, [n]);

  const goToStage = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    if (!enhanced) {
      document.getElementById(`${id}-panel-${i}`)?.scrollIntoView({ behavior: motionAllowed() ? "smooth" : "auto", block: "start" });
      return;
    }
    const top = section.getBoundingClientRect().top + window.scrollY;
    const travel = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + travel * ((i + 0.5) / n), behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={label}
      className={`story ${className}`}
      data-stage={stage}
      data-enhanced={enhanced ? "true" : undefined}
      style={{ ["--n" as string]: n }}
    >
      <div className="story__sticky">
        <div className="wrap story__frame">
          <div className="story__head">{head}</div>
          <div className="story__body">
            <div className="story__panels">
              {panels.map((panel, i) => (
                <div
                  key={tabs[i]?.key ?? i}
                  id={`${id}-panel-${i}`}
                  className="story__panel"
                  data-active={i === stage ? "true" : "false"}
                  inert={enhanced && i !== stage ? true : undefined}
                >
                  {panel}
                </div>
              ))}
            </div>
            <div className="story__visual">{visual}</div>
          </div>
          <div className="story__tabs">
            <ol role="list">
              {tabs.map((tab, i) => (
                <li key={tab.key} style={{ ["--i" as string]: i }}>
                  <button
                    type="button"
                    className="story__tab"
                    aria-current={i === stage ? "step" : undefined}
                    onClick={() => goToStage(i)}
                  >
                    <span className="num">{String(i + 1).padStart(2, "0")}</span>
                    <span>{tab.label}</span>
                  </button>
                  <span className="story__tab-line" aria-hidden="true">
                    <span />
                  </span>
                </li>
              ))}
            </ol>
            {scrollHint ? (
              <p className="story__hint mono" aria-hidden="true">
                {scrollHint} ↓
              </p>
            ) : null}
          </div>
          {foot}
        </div>
      </div>
    </section>
  );
}
