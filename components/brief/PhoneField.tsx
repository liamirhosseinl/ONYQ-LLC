"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  PINNED_COUNTRIES,
  callingCode,
  composePhone,
  detectCountry,
  digitsOf,
  examplePhone,
  formatAsYouType,
  isTooLong,
  nationalPart,
  type CountryCode,
} from "@/lib/phone.ts";
import { Chevron } from "@/components/ui/icons.tsx";

/**
 * Phone input with a country picker: flag + calling code, a searchable list of every
 * country, and a national-number field that formats as you type and stops at the longest
 * valid length. Flags are SVG files (public/flags, MIT) because flag emoji don't render on
 * Windows. The list is a proper listbox: arrows, Home/End, Enter and Escape all work.
 */
export function PhoneField({
  id,
  value,
  country,
  onChange,
  invalid,
  describedBy,
  required,
  autoFocus,
}: {
  id: string;
  value: string;
  country?: CountryCode;
  onChange: (value: string, country: CountryCode) => void;
  invalid?: boolean;
  describedBy?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const t = useTranslations("phone");
  const locale = useLocale();
  const uid = useId();
  const current = country ?? DEFAULT_COUNTRY;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const names = useMemo(() => {
    let display: Intl.DisplayNames | null = null;
    try {
      display = new Intl.DisplayNames([locale, "en"], { type: "region" });
    } catch {
      display = null;
    }
    const map = new Map<CountryCode, string>();
    for (const c of COUNTRIES) map.set(c, display?.of(c) ?? c);
    return map;
  }, [locale]);

  const ordered = useMemo(() => {
    const collator = new Intl.Collator(locale);
    const rest = COUNTRIES.filter((c) => !PINNED_COUNTRIES.includes(c)).sort((a, b) => collator.compare(names.get(a)!, names.get(b)!));
    return [...PINNED_COUNTRIES.filter((c) => COUNTRIES.includes(c)), ...rest];
  }, [locale, names]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return ordered;
    return ordered.filter((c) => {
      const name = names.get(c)!.toLowerCase();
      return name.includes(q) || c.toLowerCase() === q || callingCode(c).startsWith(q);
    });
  }, [query, ordered, names]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    search.current?.focus();
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  const national = nationalPart(value, current);
  const shown = formatAsYouType(current, national);

  function choose(c: CountryCode) {
    setOpen(false);
    setQuery("");
    onChange(composePhone(c, nationalPart(value, current)), c);
    requestAnimationFrame(() => input.current?.focus());
  }

  function onType(raw: string) {
    // A pasted "+7 916 …" switches the country by itself.
    if (raw.trim().startsWith("+")) {
      const detected = detectCountry(raw);
      if (detected) {
        const rest = digitsOf(raw).slice(callingCode(detected).length);
        onChange(composePhone(detected, rest), detected);
        return;
      }
    }
    let digits = digitsOf(raw);
    while (digits.length && isTooLong(current, digits)) digits = digits.slice(0, -1);
    onChange(composePhone(current, digits), current);
  }

  function onListKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown") setCursor((i) => Math.min(i + 1, filtered.length - 1));
    else if (e.key === "ArrowUp") setCursor((i) => Math.max(i - 1, 0));
    else if (e.key === "Home") setCursor(0);
    else if (e.key === "End") setCursor(filtered.length - 1);
    else if (e.key === "Enter") {
      if (filtered[cursor]) choose(filtered[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
    } else return;
    e.preventDefault();
  }

  const listId = `${uid}-countries`;

  return (
    <div className="phone-field" ref={wrap} data-invalid={invalid ? "true" : undefined}>
      <button
        ref={trigger}
        type="button"
        className="phone-field__country"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={t("country", { country: names.get(current) ?? current, code: callingCode(current) })}
        onClick={() => {
          setCursor(Math.max(0, filtered.indexOf(current)));
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <img className="phone-field__flag" src={`/flags/${current.toLowerCase()}.svg`} alt="" width={24} height={16} />
        <span className="phone-field__code">+{callingCode(current)}</span>
        <Chevron size={12} />
      </button>
      <input
        ref={input}
        id={id}
        className="field__input phone-field__input"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        autoFocus={autoFocus}
        placeholder={examplePhone(current)}
        value={shown}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        maxLength={24}
        onChange={(e) => onType(e.target.value)}
      />

      {open ? (
        <div className="phone-field__pop" data-lenis-prevent>
          <input
            ref={search}
            className="phone-field__search"
            type="search"
            placeholder={t("search")}
            aria-label={t("search")}
            aria-controls={listId}
            aria-activedescendant={filtered[cursor] ? `${uid}-c-${filtered[cursor]}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onListKey}
          />
          <ul id={listId} ref={list} role="listbox" aria-label={t("countries")} className="phone-field__list">
            {filtered.length === 0 ? <li className="phone-field__empty">{t("noMatch")}</li> : null}
            {filtered.map((c, i) => (
              <li
                key={c}
                id={`${uid}-c-${c}`}
                role="option"
                aria-selected={c === current}
                data-index={i}
                data-cursor={i === cursor ? "true" : undefined}
                data-pinned={!query && i === PINNED_COUNTRIES.length - 1 ? "true" : undefined}
                onPointerEnter={() => setCursor(i)}
                onClick={() => choose(c)}
              >
                <img src={`/flags/${c.toLowerCase()}.svg`} alt="" width={21} height={14} loading="lazy" decoding="async" />
                <span className="phone-field__name">{names.get(c)}</span>
                <span className="phone-field__dial">+{callingCode(c)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
