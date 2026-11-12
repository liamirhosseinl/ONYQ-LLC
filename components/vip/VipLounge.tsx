"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ServiceId } from "@/data/services.ts";
import { useCatalogue } from "@/components/site/CatalogueProvider.tsx";
import { convertUsd, formatMoney } from "@/lib/pricing.ts";
import { VIP_DISCOUNT_PERCENT, vipPriceUsd, vipQuote, vipRequestSchema } from "@/lib/vip.ts";
import type { CountryCode } from "@/lib/phone.ts";
import { usePricing } from "@/components/pricing/PricingProvider.tsx";
import { CurrencyNote, CurrencyToggle } from "@/components/pricing/CurrencyToggle.tsx";
import { PhoneField } from "@/components/brief/PhoneField.tsx";
import { ArrowRight, Check } from "@/components/ui/icons.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";

type Phase = "gate" | "opening" | "lounge" | "sent";
type GateError = "codeInvalid" | "rateLimited" | "network" | null;
type Errors = Partial<Record<"needs" | "services" | "name" | "phone" | "email" | "form", string>>;

const STORE = "onyq.vip.v1";

/**
 * The VIP lounge (/vip). A gate asks for the invitation code; the server checks it and returns
 * the business name. The lounge then shows every service at the VIP price with a live total,
 * and sends the request to Admin → Inbox (flagged VIP). The code and business name are kept in
 * sessionStorage only, so a refresh doesn't lock the visitor out mid-request.
 */
export function VipLounge() {
  const t = useTranslations("vip");
  const locale = useLocale();
  const catalogue = useCatalogue(locale);
  const { categories, services } = catalogue;
  const copy = catalogue.copy as typeof catalogue.copy & { serviceCopy: Record<string, { name: string; short: string }> };
  const { currency, amd } = usePricing();
  const uid = useId();

  const [phase, setPhase] = useState<Phase>("gate");
  const [code, setCode] = useState("");
  const [business, setBusiness] = useState("");
  const [gateBusy, setGateBusy] = useState(false);
  const [gateError, setGateError] = useState<GateError>(null);

  const [needs, setNeeds] = useState("");
  const [picked, setPicked] = useState<ServiceId[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<CountryCode | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const welcomeRef = useRef<HTMLHeadingElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) || "null") as { code: string; business: string } | null;
      if (saved?.code && saved.business) {
        setCode(saved.code);
        setBusiness(saved.business);
        setPhase("lounge");
      }
    } catch {
      /* storage unavailable — the visitor simply enters the code again */
    }
  }, []);

  useEffect(() => {
    if (phase === "lounge") welcomeRef.current?.focus({ preventScroll: true });
    if (phase === "sent") sentRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const money = (usd: number) => formatMoney({ amount: convertUsd(usd, currency, amd), currency }, locale);
  const quote = useMemo(() => vipQuote(picked, services), [picked, services]);
  const saved = quote.oneTime.regularUsd - quote.oneTime.vipUsd + (quote.monthly.regularUsd - quote.monthly.vipUsd);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) {
      setGateError("codeInvalid");
      return;
    }
    setGateBusy(true);
    setGateError(null);
    try {
      const res = await fetch("/api/vip?step=check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      if (res.ok) {
        const data = (await res.json()) as { business: string };
        setBusiness(data.business);
        try {
          sessionStorage.setItem(STORE, JSON.stringify({ code: value, business: data.business }));
        } catch {
          /* optional */
        }
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setPhase("opening");
        window.setTimeout(() => {
          setPhase("lounge");
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }, reduce ? 0 : 1500);
      } else {
        setGateError(res.status === 429 ? "rateLimited" : "codeInvalid");
      }
    } catch {
      setGateError("network");
    } finally {
      setGateBusy(false);
    }
  }

  function relock() {
    try {
      sessionStorage.removeItem(STORE);
    } catch {
      /* optional */
    }
    setCode("");
    setBusiness("");
    setPicked([]);
    setErrors({});
    setPhase("gate");
  }

  function toggle(id: ServiceId) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setErrors((er) => ({ ...er, services: undefined }));
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const payload = { code, needs, services: picked, name, phone, email, locale, website: honeypot.current?.value ?? "" };
    const check = vipRequestSchema.safeParse(payload);
    if (!check.success) {
      const out: Errors = {};
      for (const issue of check.error.issues) {
        const f = String(issue.path[0]) as keyof Errors;
        if (!out[f]) out[f] = issue.message;
      }
      setErrors(out);
      const first = (["needs", "services", "name", "phone", "email"] as const).find((f) => out[f]);
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const res = await fetch("/api/vip?step=request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setPhase("sent");
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      } else if (res.status === 403) {
        relock();
        setGateError("codeInvalid");
      } else if (res.status === 429) {
        setErrors({ form: "rateLimited" });
      } else {
        setErrors({ form: "generic" });
      }
    } catch {
      setErrors({ form: "network" });
    } finally {
      setSending(false);
    }
  }

  const err = (f: keyof Errors) => {
    const key = errors[f];
    if (!key) return null;
    if (key === "rateLimited" || key === "network") return t(key);
    return t(`errors.${key}` as never);
  };

  return (
    <div className="vip" data-phase={phase}>
      <div className="vip__aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="vip__grain" aria-hidden="true" />

      {phase === "gate" || phase === "opening" ? (
        <section className="vip-gate wrap" aria-labelledby={`${uid}-gate-title`}>
          <div className="vip-seal" aria-hidden="true">
            <svg viewBox="0 0 200 200" className="vip-seal__ring">
              <defs>
                <path id={`${uid}-circle`} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
              </defs>
              <circle cx="100" cy="100" r="92" className="vip-seal__line" />
              <circle cx="100" cy="100" r="64" className="vip-seal__line vip-seal__line--thin" />
              <text className="vip-seal__text">
                <textPath href={`#${uid}-circle`}>ONYQ · PRIVATE CLIENT · BY INVITATION · ONYQ · PRIVATE CLIENT · BY INVITATION ·</textPath>
              </text>
            </svg>
            <span className="vip-seal__core">
              <Spark />
            </span>
          </div>

          <p className="vip__eyebrow">{t("eyebrow")}</p>
          <h1 id={`${uid}-gate-title`} className="vip__title">
            <span>{t("title1")}</span>
            <span className="vip__gold">{t("title2")}</span>
          </h1>
          <p className="vip__lead">{t("lead")}</p>

          <form className="vip-code" onSubmit={unlock} noValidate>
            <label htmlFor={`${uid}-code`} className="vip-code__label">
              {t("codeLabel")}
            </label>
            <div className="vip-code__row">
              <input
                id={`${uid}-code`}
                className="vip-code__input"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setGateError(null);
                }}
                placeholder={t("codePlaceholder")}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={120}
                aria-invalid={gateError ? true : undefined}
                aria-describedby={`${uid}-code-hint`}
                disabled={phase === "opening"}
              />
              <button type="submit" className="vip-btn" disabled={gateBusy || phase === "opening"}>
                {gateBusy ? t("checking") : t("unlock")} <ArrowRight />
              </button>
            </div>
            <p id={`${uid}-code-hint`} className={gateError ? "vip-code__error" : "vip-code__hint"} role={gateError ? "alert" : undefined}>
              {gateError ? t(gateError) : t("codeHint")}
            </p>
          </form>
        </section>
      ) : null}

      {phase === "lounge" ? (
        <div className="vip-lounge wrap">
          <header className="vip-welcome">
            <p className="vip__eyebrow">
              <Check /> {t("welcomeKicker")}
            </p>
            <h1 ref={welcomeRef} tabIndex={-1} className="vip__title vip__title--welcome">
              {t.rich("welcome", { business, b: (chunks) => <span className="vip__gold">{chunks}</span> })}
            </h1>
            <p className="vip__lead">{t("welcomeLead", { percent: VIP_DISCOUNT_PERCENT })}</p>
            <div className="vip-welcome__row">
              <span className="vip-badge">{t("badge", { percent: VIP_DISCOUNT_PERCENT })}</span>
              <CurrencyToggle />
              <button type="button" className="vip-link" onClick={relock}>
                {t("otherCode")}
              </button>
            </div>
            <CurrencyNote />
            <ul role="list" className="vip-perks">
              {(t.raw("perks") as string[]).map((p, i) => (
                <li key={p} style={{ "--i": i } as CSSProperties}>
                  <Spark /> {p}
                </li>
              ))}
            </ul>
          </header>

          <form className="vip-form" onSubmit={send} noValidate>
            <div className="vip-form__main">
              <section className="vip-step" aria-labelledby={`${uid}-s1`}>
                <h2 id={`${uid}-s1`} className="vip-step__title">
                  <span className="vip-step__num">01</span> {t("step1")}
                </h2>
                <textarea
                  id={`${uid}-needs`}
                  className="vip-input vip-input--area"
                  rows={5}
                  maxLength={3000}
                  value={needs}
                  placeholder={t("needsPlaceholder")}
                  aria-label={t("step1")}
                  aria-invalid={errors.needs ? true : undefined}
                  aria-describedby={errors.needs ? `${uid}-needs-err` : undefined}
                  onChange={(e) => {
                    setNeeds(e.target.value);
                    setErrors((er) => ({ ...er, needs: undefined }));
                  }}
                />
                {err("needs") ? (
                  <p className="vip-error" id={`${uid}-needs-err`}>
                    {err("needs")}
                  </p>
                ) : null}
              </section>

              <section className="vip-step" aria-labelledby={`${uid}-s2`}>
                <h2 id={`${uid}-s2`} className="vip-step__title">
                  <span className="vip-step__num">02</span> {t("step2")}
                </h2>
                <p className="vip-step__lead">{t("step2Lead")}</p>
                <div id={`${uid}-services`} tabIndex={-1} className="vip-cats" aria-describedby={errors.services ? `${uid}-services-err` : undefined}>
                  {categories.map((cat) => (
                    <fieldset key={cat.id} className="vip-cat">
                      <legend className="vip-cat__title">{copy.categoryCopy[cat.id].title}</legend>
                      <div className="vip-cat__grid">
                        {services
                          .filter((s) => s.category === cat.id)
                          .map((s) => {
                            const on = picked.includes(s.id);
                            const vipUsd = vipPriceUsd(s.regularPriceUsd);
                            const per = s.billingType === "monthly" ? t("perMonth") : "";
                            return (
                              <label key={s.id} className="vip-card" data-on={on ? "true" : undefined}>
                                <input type="checkbox" className="vip-card__check" checked={on} onChange={() => toggle(s.id)} />
                                <span className="vip-card__tick" aria-hidden="true">
                                  <Check />
                                </span>
                                <span className="vip-card__name">{copy.serviceCopy[s.id].name}</span>
                                <span className="vip-card__desc">{copy.serviceCopy[s.id].short}</span>
                                <span className="vip-card__prices">
                                  <s className="vip-card__regular">
                                    <span className="sr-only">{t("regular")}: </span>
                                    {money(s.regularPriceUsd)}
                                    {per}
                                  </s>
                                  <span className="vip-card__vip">
                                    <span className="sr-only">{t("yours")}: </span>
                                    <small>{t("from")}</small> {money(vipUsd)}
                                    {per}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    </fieldset>
                  ))}
                </div>
                {err("services") ? (
                  <p className="vip-error" id={`${uid}-services-err`}>
                    {err("services")}
                  </p>
                ) : null}
              </section>

              <section className="vip-step" aria-labelledby={`${uid}-s3`}>
                <h2 id={`${uid}-s3`} className="vip-step__title">
                  <span className="vip-step__num">03</span> {t("step3")}
                </h2>
                <div className="vip-fields">
                  <div className="vip-field">
                    <label htmlFor={`${uid}-name`}>{t("name")}</label>
                    <input
                      id={`${uid}-name`}
                      className="vip-input"
                      autoComplete="name"
                      maxLength={120}
                      value={name}
                      aria-invalid={errors.name ? true : undefined}
                      aria-describedby={errors.name ? `${uid}-name-err` : undefined}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((er) => ({ ...er, name: undefined }));
                      }}
                    />
                    {err("name") ? (
                      <p className="vip-error" id={`${uid}-name-err`}>
                        {err("name")}
                      </p>
                    ) : null}
                  </div>
                  <div className="vip-field">
                    <label htmlFor={`${uid}-phone`}>{t("phone")}</label>
                    <PhoneField
                      id={`${uid}-phone`}
                      value={phone}
                      country={phoneCountry}
                      required
                      onChange={(v, c) => {
                        setPhone(v);
                        setPhoneCountry(c);
                        setErrors((er) => ({ ...er, phone: undefined }));
                      }}
                      invalid={!!errors.phone}
                      describedBy={errors.phone ? `${uid}-phone-err` : undefined}
                    />
                    {err("phone") ? (
                      <p className="vip-error" id={`${uid}-phone-err`}>
                        {err("phone")}
                      </p>
                    ) : null}
                  </div>
                  <div className="vip-field vip-field--wide">
                    <label htmlFor={`${uid}-email`}>
                      {t("email")} <span className="vip-optional">({t("optional")})</span>
                    </label>
                    <input
                      id={`${uid}-email`}
                      className="vip-input"
                      type="email"
                      autoComplete="email"
                      maxLength={200}
                      value={email}
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={errors.email ? `${uid}-email-err` : undefined}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((er) => ({ ...er, email: undefined }));
                      }}
                    />
                    {err("email") ? (
                      <p className="vip-error" id={`${uid}-email-err`}>
                        {err("email")}
                      </p>
                    ) : null}
                  </div>
                </div>
                <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" className="vip-hp" aria-hidden="true" />
              </section>
            </div>

            <aside className="vip-summary" aria-label={t("summary")}>
              <div className="vip-summary__card">
                <p className="vip-summary__kicker">
                  <Spark /> {t("summary")}
                </p>
                <p className="vip-summary__business">{business}</p>
                {quote.lines.length ? (
                  <>
                    <ul role="list" className="vip-summary__lines">
                      {quote.lines.map((l) => (
                        <li key={l.id}>
                          <span>{copy.serviceCopy[l.id].name}</span>
                          <b>
                            {money(l.vipUsd)}
                            {l.billing === "monthly" ? t("perMonth") : ""}
                          </b>
                        </li>
                      ))}
                    </ul>
                    <dl className="vip-summary__totals">
                      {quote.oneTime.vipUsd ? (
                        <div>
                          <dt>{t("oneTime")}</dt>
                          <dd>
                            <s>{money(quote.oneTime.regularUsd)}</s> <b>{money(quote.oneTime.vipUsd)}</b>
                          </dd>
                        </div>
                      ) : null}
                      {quote.monthly.vipUsd ? (
                        <div>
                          <dt>{t("monthly")}</dt>
                          <dd>
                            <s>
                              {money(quote.monthly.regularUsd)}
                              {t("perMonth")}
                            </s>{" "}
                            <b>
                              {money(quote.monthly.vipUsd)}
                              {t("perMonth")}
                            </b>
                          </dd>
                        </div>
                      ) : null}
                      <div className="vip-summary__save">
                        <dt>{t("save")}</dt>
                        <dd>{money(saved)}</dd>
                      </div>
                    </dl>
                    <p className="vip-summary__count">{t("count", { count: quote.lines.length })}</p>
                  </>
                ) : (
                  <p className="vip-summary__empty">{t("summaryEmpty")}</p>
                )}
                <button type="submit" className="vip-btn vip-btn--block" disabled={sending}>
                  {sending ? t("sending") : t("send")} <ArrowRight />
                </button>
                {err("form") ? (
                  <p className="vip-error" role="alert">
                    {err("form")}
                  </p>
                ) : null}
                <p className="vip-summary__fine">{t("fine")}</p>
              </div>
            </aside>
          </form>
        </div>
      ) : null}

      {phase === "sent" ? (
        <section className="vip-sent wrap" aria-labelledby={`${uid}-sent`}>
          <div className="vip-seal vip-seal--done" aria-hidden="true">
            <span className="vip-seal__core">
              <Check />
            </span>
          </div>
          <p className="vip__eyebrow">{t("successKicker")}</p>
          <h1 id={`${uid}-sent`} ref={sentRef} tabIndex={-1} className="vip__title vip__title--welcome">
            {t("successTitle", { name: name.trim().split(/\s+/)[0] || business })}
          </h1>
          <p className="vip__lead">{t("successBody", { business })}</p>
          <button
            type="button"
            className="vip-btn"
            onClick={() => {
              setNeeds("");
              setPicked([]);
              setPhase("lounge");
            }}
          >
            {t("again")} <ArrowRight />
          </button>
        </section>
      ) : null}
    </div>
  );
}
