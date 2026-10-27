"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CHALLENGE_TYPES, SERVICE_AREAS, TIMINGS } from "@/lib/enquiry-schema.ts";
import { getCatalogueCopy } from "@/content/catalogue.ts";
import { useBrief, type Area } from "@/components/brief/BriefProvider.tsx";
import { ArrowUpRight, Replay } from "@/components/ui/icons.tsx";

type Line = 0 | 1 | 2;

/**
 * Letter-style CTA (reference: "Now comes your story" letter). Here it is a working first
 * half of the brief: three choices write three sentences into a live letter, and
 * "Continue this letter" opens the brief at the next unanswered step with everything kept.
 */
export function LetterComposer() {
  const t = useTranslations("letter");
  const tb = useTranslations("brief");
  const locale = useLocale();
  const copy = getCatalogueCopy(locale);
  const { draft, update, open } = useBrief();
  const [active, setActive] = useState<Line>(0);
  const [typed, setTyped] = useState<Line | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const lowerAreas = draft.areas.map((a) => copy.categoryCopy[a].title.toLowerCase());
  const areaText = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(lowerAreas);

  const sentences = [
    draft.challengeType ? t("sentence1", { thing: t(`things.${draft.challengeType}`) }) : null,
    draft.areas.length ? t("sentence2", { areas: areaText }) : null,
    draft.timing ? t("sentence3timing", { timing: t(`timingPhrases.${draft.timing}`) }) : null,
  ];
  const placeholders = [t("placeholder1"), t("placeholder2"), t("placeholder3")];
  const done = sentences.filter(Boolean).length;

  const flash = (line: Line) => {
    setTyped(line);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTyped(null), 900);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const lines: { title: string; hint: string }[] = [
    { title: t("line1"), hint: t("line1Hint") },
    { title: t("line2"), hint: t("line2Hint") },
    { title: t("line3"), hint: t("line3Hint") },
  ];

  return (
    <div className="letter">
      <div className="letter__steps">
        <p className="eyebrow eyebrow--muted">{t("linesLabel")}</p>
        <ol role="list">
          {lines.map((line, i) => (
            <li key={line.title} className="letter__step" data-open={active === i ? "true" : "false"} data-done={sentences[i] ? "true" : "false"}>
              <button
                type="button"
                className="letter__step-head"
                aria-expanded={active === i}
                aria-controls={`letter-line-${i}`}
                onClick={() => setActive(i as Line)}
              >
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span className="letter__step-title">
                  <span className="t-h3">{line.title}</span>
                  <span className="t-small">{line.hint}</span>
                </span>
                <span className="letter__dot" aria-hidden="true" />
              </button>
              <div id={`letter-line-${i}`} className="letter__options" hidden={active !== i}>
                {i === 0 && (
                  <fieldset className="chips">
                    <legend className="sr-only">{line.title}</legend>
                    {CHALLENGE_TYPES.map((c) => (
                      <label className="chip" key={c}>
                        <input
                          type="radio"
                          name="letter-challenge"
                          checked={draft.challengeType === c}
                          onChange={() => {
                            update({ challengeType: c });
                            flash(0);
                          }}
                        />
                        <span>{tb(`challengeTypes.${c}`)}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
                {i === 1 && (
                  <fieldset className="chips">
                    <legend className="sr-only">{line.title}</legend>
                    {SERVICE_AREAS.map((a) => (
                      <label className="chip" key={a}>
                        <input
                          type="checkbox"
                          checked={draft.areas.includes(a)}
                          onChange={(e) => {
                            update({ areas: e.target.checked ? [...draft.areas, a] : draft.areas.filter((x: Area) => x !== a) });
                            flash(1);
                          }}
                        />
                        <span>{copy.categoryCopy[a].title}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
                {i === 2 && (
                  <fieldset className="chips">
                    <legend className="sr-only">{line.title}</legend>
                    {TIMINGS.map((x) => (
                      <label className="chip" key={x}>
                        <input
                          type="radio"
                          name="letter-timing"
                          checked={draft.timing === x}
                          onChange={() => {
                            update({ timing: x });
                            flash(2);
                          }}
                        />
                        <span>{tb(`timings.${x}`)}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
                {i < 2 ? (
                  <button type="button" className="btn btn--text btn--small" onClick={() => setActive((i + 1) as Line)}>
                    {tb("continue")}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="btn btn--text btn--small letter__replay"
          onClick={() => {
            update({ challengeType: undefined, areas: [], timing: undefined });
            setActive(0);
          }}
        >
          <Replay /> {t("replay")}
        </button>
      </div>

      <div className="letter__paper-wrap">
        <article className="letter__paper" aria-live="polite" aria-label={t("subject")}>
          <header className="letter__meta mono">
            <span>{t("to")}</span>
            <span>{String(done).padStart(2, "0")} / 03</span>
          </header>
          <p className="letter__subject">{t("subject")}</p>
          <p className="letter__greeting">{t("greeting")}</p>
          {sentences.map((s, i) => (
            <p key={i} className="letter__line" data-filled={s ? "true" : "false"} data-typed={typed === i ? "true" : "false"}>
              {s ?? placeholders[i]}
            </p>
          ))}
          <p className="letter__sign">{t("signoff")}</p>
          <footer className="letter__foot">
            <button
              type="button"
              className="btn btn--dark"
              aria-haspopup="dialog"
              onClick={() => open()}
            >
              {t("continue")} <ArrowUpRight />
            </button>
          </footer>
        </article>
      </div>
    </div>
  );
}
