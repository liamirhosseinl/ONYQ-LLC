"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { track } from "@/components/analytics/Tracker.tsx";
import { useLocale, useTranslations } from "next-intl";
import {
  BUDGETS,
  CHALLENGE_TYPES,
  SERVICE_AREAS,
  STAGES,
  STEP_FIELDS,
  TIMINGS,
  enquirySchema,
} from "@/lib/enquiry-schema.ts";
import { getService } from "@/data/services.ts";
import { siteConfig } from "@/data/site-config.ts";
import { useContact } from "@/components/site/ContactProvider.tsx";
import { getCatalogueCopy } from "@/content/catalogue.ts";
import { formatMoney } from "@/lib/pricing.ts";
import { Link } from "@/i18n/navigation.ts";
import { ArrowLeft, ArrowRight, Check, Copy } from "@/components/ui/icons.tsx";
import { STEP_ORDER, useBrief, type Area, type BriefDraft, type StepId, EMPTY_DRAFT } from "./BriefProvider.tsx";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; email: string }
  | { kind: "error"; reason: "not_configured" | "delivery" | "invalid" | "rate_limited" | "network" };

type FieldErrors = Partial<Record<string, string>>;

function toPayload(d: BriefDraft, locale: string) {
  return {
    challengeType: d.challengeType,
    challenge: d.challenge,
    stage: d.stage,
    areas: d.areas,
    budget: d.budget,
    timing: d.timing,
    name: d.name,
    email: d.email,
    company: d.company,
    phone: d.phone,
    serviceId: d.serviceId,
    locale,
    website: "",
  };
}

export function BriefFlow({ variant = "page" }: { variant?: "page" | "dialog" }) {
  const t = useTranslations("brief");
  const tPrice = useTranslations("common");
  const locale = useLocale();
  const { draft, update, reset, initialStep } = useBrief();
  const contact = useContact();
  const copy = getCatalogueCopy(locale);
  const formId = useId();

  const [step, setStep] = useState<StepId>(variant === "dialog" ? initialStep : "challenge");
  const [furthest, setFurthest] = useState(STEP_ORDER.indexOf(step));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const honeypot = useRef<HTMLInputElement>(null);

  const index = STEP_ORDER.indexOf(step);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (variant !== "dialog") return;
    }
    headingRef.current?.focus();
  }, [step, variant]);

  const interest = draft.serviceId ? getService(draft.serviceId) : null;

  function validate(fields: readonly string[]): FieldErrors {
    const result = enquirySchema.safeParse(toPayload(draft, locale));
    if (result.success) return {};
    const out: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      if (!fields.includes(field) || out[field]) continue;
      const known = ["challenge_short", "challenge_long", "name_required", "name_long", "email_invalid"];
      out[field] = known.includes(issue.message) ? issue.message : field;
    }
    return out;
  }

  function goTo(next: StepId) {
    setStatus((s) => (s.kind === "error" ? { kind: "idle" } : s));
    setStep(next);
    setFurthest((f) => Math.max(f, STEP_ORDER.indexOf(next)));
  }

  function onContinue() {
    const fields = step === "review" ? [] : STEP_FIELDS[step];
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`${formId}-${first}`)?.focus();
      return;
    }
    goTo(STEP_ORDER[index + 1]);
  }

  async function onSubmit() {
    const all = validate(Object.values(STEP_FIELDS).flat());
    if (Object.keys(all).length) {
      setErrors(all);
      setStatus({ kind: "error", reason: "invalid" });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const payload = { ...toPayload(draft, locale), page: location.pathname, website: honeypot.current?.value ?? "" };
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const email = draft.email;
        track("brief_sent", { type: draft.challengeType ?? "other" });
        setStatus({ kind: "success", email });
        reset();
        return;
      }
      const reason =
        res.status === 503 ? "not_configured" : res.status === 400 ? "invalid" : res.status === 429 ? "rate_limited" : "delivery";
      setStatus({ kind: "error", reason });
    } catch {
      setStatus({ kind: "error", reason: "network" });
    }
  }

  const summaryText = useMemo(() => buildSummary(draft, t, copy.serviceCopy, locale), [draft, t, copy, locale]);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  if (status.kind === "success") {
    return (
      <div className="brief brief--done" data-variant={variant}>
        <div className="brief__result" role="status">
          <span className="brief__result-icon" aria-hidden="true">
            <Check size={22} />
          </span>
          <h2 className="t-h3" tabIndex={-1} ref={headingRef}>
            {t("successTitle")}
          </h2>
          <p className="t-lead">{t("successBody", { email: status.email })}</p>
          <button type="button" className="btn btn--ghost" onClick={() => { setStatus({ kind: "idle" }); goTo("challenge"); setFurthest(0); }}>
            {t("successAgain")}
          </button>
        </div>
      </div>
    );
  }

  const stepTitle: Record<StepId, string> = {
    challenge: t("q.challenge"),
    stage: t("q.stage"),
    areas: t("q.areas"),
    budget: t("q.budget"),
    contact: t("q.contact"),
    review: t("q.review"),
  };

  const errorText = (field: string) => (errors[field] ? t(`errors.${errors[field]}` as never) : null);

  return (
    <div className="brief" data-variant={variant}>
      <nav className="brief__steps" aria-label={t("dialogLabel")}>
        <ol role="list">
          {STEP_ORDER.map((id, i) => (
            <li key={id}>
              <button
                type="button"
                className="brief__step"
                aria-current={id === step ? "step" : undefined}
                disabled={i > furthest || status.kind === "sending"}
                onClick={() => goTo(id)}
              >
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span>{t(`steps.${id}`)}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="brief__body">
        <form
          className="brief__main"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step === "review") void onSubmit();
            else onContinue();
          }}
          aria-describedby={`${formId}-progress`}
        >
          <p id={`${formId}-progress`} className="mono brief__progress">
            {tPrice("stage", { current: index + 1, total: STEP_ORDER.length })}
          </p>
          <h2 className="brief__question t-h3" tabIndex={-1} ref={headingRef}>
            {stepTitle[step]}
          </h2>

          {interest && step === "challenge" ? (
            <p className="brief__interest">
              <span className="mono">{t("interest")}</span>
              <span>
                {copy.serviceCopy[interest.id].name} · {tPrice("from")}{" "}
                {formatMoney({ amount: interest.regularPriceUsd, currency: "USD" }, locale)}
                {interest.billingType === "monthly" ? tPrice("perMonthSuffix") : ""}
              </span>
              <button type="button" className="brief__interest-clear" onClick={() => update({ serviceId: undefined })}>
                {tPrice("close")}
              </button>
            </p>
          ) : null}

          {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
          <div className="brief__hp" aria-hidden="true">
            <label>
              Website
              <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>

          {step === "challenge" && (
            <div className="brief__fields">
              <p className="t-small">{t("q.challengeHint")}</p>
              <fieldset className="chips" aria-invalid={!!errors.challengeType} aria-describedby={errors.challengeType ? `${formId}-challengeType-err` : undefined}>
                <legend className="sr-only">{t("q.challenge")}</legend>
                {CHALLENGE_TYPES.map((c, i) => (
                  <label key={c} className="chip">
                    <input
                      id={i === 0 ? `${formId}-challengeType` : undefined}
                      type="radio"
                      name="challengeType"
                      value={c}
                      checked={draft.challengeType === c}
                      onChange={() => update({ challengeType: c })}
                    />
                    <span>{t(`challengeTypes.${c}`)}</span>
                  </label>
                ))}
              </fieldset>
              {errorText("challengeType") && (
                <p className="field__error" id={`${formId}-challengeType-err`}>{errorText("challengeType")}</p>
              )}
              <div className="field">
                <label htmlFor={`${formId}-challenge`} className="field__label">{t("q.challengeLabel")}</label>
                <textarea
                  id={`${formId}-challenge`}
                  className="field__input field__input--area"
                  rows={4}
                  maxLength={2000}
                  value={draft.challenge}
                  placeholder={t("q.challengePlaceholder")}
                  aria-invalid={!!errors.challenge}
                  aria-describedby={errors.challenge ? `${formId}-challenge-err` : undefined}
                  onChange={(e) => update({ challenge: e.target.value })}
                />
                {errorText("challenge") && <p className="field__error" id={`${formId}-challenge-err`}>{errorText("challenge")}</p>}
              </div>
            </div>
          )}

          {step === "stage" && (
            <div className="brief__fields">
              <fieldset className="options" aria-invalid={!!errors.stage}>
                <legend className="sr-only">{t("q.stage")}</legend>
                {STAGES.map((s, i) => (
                  <label key={s} className="option">
                    <input
                      id={i === 0 ? `${formId}-stage` : undefined}
                      type="radio"
                      name="stage"
                      value={s}
                      checked={draft.stage === s}
                      onChange={() => update({ stage: s })}
                    />
                    <span className="option__title">{t(`stages.${s}`)}</span>
                    <span className="option__hint">{t(`stages.${s}Hint` as never)}</span>
                  </label>
                ))}
              </fieldset>
              {errorText("stage") && <p className="field__error">{errorText("stage")}</p>}
            </div>
          )}

          {step === "areas" && (
            <div className="brief__fields">
              <p className="t-small">{t("q.areasHint")}</p>
              <fieldset className="chips">
                <legend className="sr-only">{t("q.areas")}</legend>
                {SERVICE_AREAS.map((a, i) => (
                  <label key={a} className="chip">
                    <input
                      id={i === 0 ? `${formId}-areas` : undefined}
                      type="checkbox"
                      value={a}
                      checked={draft.areas.includes(a)}
                      onChange={(e) =>
                        update({
                          areas: e.target.checked ? [...draft.areas, a] : draft.areas.filter((x: Area) => x !== a),
                        })
                      }
                    />
                    <span>{copy.categoryCopy[a].title}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          )}

          {step === "budget" && (
            <div className="brief__fields">
              <p className="t-small">{t("q.budgetHint")}</p>
              <fieldset className="chips">
                <legend className="field__label">{t("q.budgetLabel")}</legend>
                {BUDGETS.map((b, i) => (
                  <label key={b} className="chip">
                    <input
                      id={i === 0 ? `${formId}-budget` : undefined}
                      type="radio"
                      name="budget"
                      value={b}
                      checked={draft.budget === b}
                      onChange={() => update({ budget: b })}
                    />
                    <span>{t(`budgets.${b}`)}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="chips">
                <legend className="field__label">{t("q.timingLabel")}</legend>
                {TIMINGS.map((x) => (
                  <label key={x} className="chip">
                    <input type="radio" name="timing" value={x} checked={draft.timing === x} onChange={() => update({ timing: x })} />
                    <span>{t(`timings.${x}`)}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          )}

          {step === "contact" && (
            <div className="brief__fields brief__fields--grid">
              {(
                [
                  ["name", "text", "name", true],
                  ["email", "email", "email", true],
                  ["company", "text", "organization", false],
                  ["phone", "tel", "tel", false],
                ] as const
              ).map(([field, type, autoComplete, required]) => (
                <div className="field" key={field}>
                  <label htmlFor={`${formId}-${field}`} className="field__label">
                    {t(`fields.${field}`)}
                    {!required && <span className="field__optional"> ({t("fields.optional")})</span>}
                  </label>
                  <input
                    id={`${formId}-${field}`}
                    className="field__input"
                    type={type}
                    autoComplete={autoComplete}
                    required={required}
                    maxLength={field === "email" ? 200 : 160}
                    value={draft[field]}
                    aria-invalid={!!errors[field]}
                    aria-describedby={errors[field] ? `${formId}-${field}-err` : undefined}
                    onChange={(e) => update({ [field]: e.target.value } as Partial<BriefDraft>)}
                  />
                  {errorText(field) && <p className="field__error" id={`${formId}-${field}-err`}>{errorText(field)}</p>}
                </div>
              ))}
            </div>
          )}

          {step === "review" && (
            <div className="brief__fields">
              <dl className="review">
                <ReviewRow label={t("steps.challenge")} onEdit={() => goTo("challenge")} editLabel={t("edit")}>
                  {draft.challengeType ? <strong>{t(`challengeTypes.${draft.challengeType}`)}</strong> : null}
                  <span className="review__text">{draft.challenge}</span>
                  {interest ? <span className="t-small">{t("interest")}: {copy.serviceCopy[interest.id].name}</span> : null}
                </ReviewRow>
                <ReviewRow label={t("steps.stage")} onEdit={() => goTo("stage")} editLabel={t("edit")}>
                  {draft.stage ? t(`stages.${draft.stage}`) : "—"}
                </ReviewRow>
                <ReviewRow label={t("steps.areas")} onEdit={() => goTo("areas")} editLabel={t("edit")}>
                  {draft.areas.length ? draft.areas.map((a) => copy.categoryCopy[a].title).join(", ") : "—"}
                </ReviewRow>
                <ReviewRow label={t("steps.budget")} onEdit={() => goTo("budget")} editLabel={t("edit")}>
                  {[draft.budget && t(`budgets.${draft.budget}`), draft.timing && t(`timings.${draft.timing}`)].filter(Boolean).join(" · ") || "—"}
                </ReviewRow>
                <ReviewRow label={t("steps.contact")} onEdit={() => goTo("contact")} editLabel={t("edit")}>
                  {[draft.name, draft.email, draft.company, draft.phone].filter(Boolean).join(" · ")}
                </ReviewRow>
              </dl>
              <p className="brief__privacy t-small">
                {t("privacy")}{" "}
                {siteConfig.legal.privacyPolicy ? <Link href="/privacy-policy">{t("privacyLink")}</Link> : null}
              </p>
            </div>
          )}

          {status.kind === "error" && (
            <div className="brief__error" role="alert">
              <p className="brief__error-title">{t("errorTitle")}</p>
              <p>
                {status.reason === "not_configured" && t("errorNotConfigured")}
                {status.reason === "delivery" && t("errorDelivery")}
                {status.reason === "invalid" && t("errorInvalid")}
                {status.reason === "rate_limited" && t("errorRateLimited")}
                {status.reason === "network" && t("errorNetwork")}
              </p>
              <div className="brief__error-actions">
                {status.reason !== "invalid" && status.reason !== "not_configured" && (
                  <button type="button" className="btn btn--small btn--light" onClick={() => void onSubmit()}>
                    {t("retry")}
                  </button>
                )}
                <button type="button" className="btn btn--small btn--ghost" onClick={() => void copySummary()}>
                  <Copy /> {copied ? t("copied") : t("copy")}
                </button>
                {contact.salesEmail ? (
                  <a
                    className="btn btn--small btn--ghost"
                    href={`mailto:${contact.salesEmail}?subject=${encodeURIComponent(t("dialogLabel"))}&body=${encodeURIComponent(summaryText)}`}
                  >
                    {t("emailInstead")}
                  </a>
                ) : null}
              </div>
            </div>
          )}

          <div className="brief__nav">
            {index > 0 ? (
              <button type="button" className="btn btn--ghost" onClick={() => goTo(STEP_ORDER[index - 1])} disabled={status.kind === "sending"}>
                <ArrowLeft /> {t("back")}
              </button>
            ) : (
              <span />
            )}
            <div className="brief__nav-right">
              {(step === "areas" || step === "budget") && (
                <button type="button" className="btn btn--text" onClick={() => goTo(STEP_ORDER[index + 1])}>
                  {t("skip")}
                </button>
              )}
              {step === "review" ? (
                <button type="submit" className="btn btn--accent" disabled={status.kind === "sending"} aria-busy={status.kind === "sending"}>
                  {status.kind === "sending" ? t("sending") : t("send")} <ArrowRight />
                </button>
              ) : (
                <button type="submit" className="btn btn--light">
                  {t("continue")} <ArrowRight />
                </button>
              )}
            </div>
          </div>
        </form>

        <aside className="brief__aside" aria-label={t("title")}>
          <div className="brief__summary">
            <div className="brief__summary-head">
              <span className="eyebrow eyebrow--muted">{t("title")}</span>
              <span className="mono">
                {String(index + 1).padStart(2, "0")} / {String(STEP_ORDER.length).padStart(2, "0")}
              </span>
            </div>
            <SummaryList draft={draft} />
            {draft !== EMPTY_DRAFT && (draft.challenge || draft.name) ? (
              <button type="button" className="btn btn--text btn--small" onClick={() => { reset(); goTo("challenge"); setFurthest(0); setErrors({}); }}>
                {t("startOver")}
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewRow({ label, children, onEdit, editLabel }: { label: string; children: React.ReactNode; onEdit: () => void; editLabel: string }) {
  return (
    <div className="review__row">
      <dt className="mono">{label}</dt>
      <dd>{children}</dd>
      <dd className="review__edit">
        <button type="button" className="btn btn--text btn--small" onClick={onEdit} aria-label={`${editLabel}: ${label}`}>
          {editLabel}
        </button>
      </dd>
    </div>
  );
}

function SummaryList({ draft }: { draft: BriefDraft }) {
  const t = useTranslations("brief");
  const locale = useLocale();
  const copy = getCatalogueCopy(locale);
  const rows: [string, string | null][] = [
    [t("steps.challenge"), draft.challengeType ? `${t(`challengeTypes.${draft.challengeType}`)}${draft.challenge ? ` — ${draft.challenge}` : ""}` : draft.challenge || null],
    [t("steps.stage"), draft.stage ? t(`stages.${draft.stage}`) : null],
    [t("steps.areas"), draft.areas.length ? draft.areas.map((a) => copy.categoryCopy[a].title).join(", ") : null],
    [t("steps.budget"), [draft.budget && t(`budgets.${draft.budget}`), draft.timing && t(`timings.${draft.timing}`)].filter(Boolean).join(" · ") || null],
    [t("steps.contact"), [draft.name, draft.email].filter(Boolean).join(" · ") || null],
  ];
  const filled = rows.filter(([, v]) => v);
  if (!filled.length) return <p className="t-small brief__summary-empty">{t("empty")}</p>;
  return (
    <dl className="summary">
      {filled.map(([k, v]) => (
        <div key={k} className="summary__row">
          <dt className="mono">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function buildSummary(
  d: BriefDraft,
  t: ReturnType<typeof useTranslations<"brief">>,
  serviceCopy: ReturnType<typeof getCatalogueCopy>["serviceCopy"],
  locale: string,
): string {
  const copy = getCatalogueCopy(locale);
  const lines = [
    `${t("steps.challenge")}: ${d.challengeType ? t(`challengeTypes.${d.challengeType}`) : "—"}`,
    d.challenge,
    d.serviceId ? `${t("interest")}: ${serviceCopy[d.serviceId].name}` : "",
    `${t("steps.stage")}: ${d.stage ? t(`stages.${d.stage}`) : "—"}`,
    `${t("steps.areas")}: ${d.areas.map((a) => copy.categoryCopy[a].title).join(", ") || "—"}`,
    `${t("q.budgetLabel")}: ${d.budget ? t(`budgets.${d.budget}`) : "—"}`,
    `${t("q.timingLabel")}: ${d.timing ? t(`timings.${d.timing}`) : "—"}`,
    `${t("fields.name")}: ${d.name}`,
    `${t("fields.email")}: ${d.email}`,
    d.company ? `${t("fields.company")}: ${d.company}` : "",
    d.phone ? `${t("fields.phone")}: ${d.phone}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}
