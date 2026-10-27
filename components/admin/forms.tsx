"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

type State = { error?: string; ok?: string } | undefined;

/** A form bound to a server action that returns { error } / { ok }, shown inline. */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnOk = false,
}: {
  action: (state: State, form: FormData) => Promise<State>;
  children: ReactNode;
  className?: string;
  resetOnOk?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);
  return (
    <form ref={ref} action={formAction} className={`a-form ${className}`}>
      {children}
      {state?.error ? (
        <p className="a-msg a-msg--error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="a-msg a-msg--ok" role="status">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}

export function Submit({ children, className = "a-btn a-btn--primary" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? <span className="a-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/** Destructive actions ask twice, in place (no browser dialogs). */
export function ConfirmSubmit({ children, confirm = "Click again to confirm", className = "a-btn a-btn--danger" }: { children: ReactNode; confirm?: string; className?: string }) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type={armed ? "submit" : "button"}
      className={`${className}${armed ? " is-armed" : ""}`}
      disabled={pending}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
    >
      {armed ? confirm : children}
    </button>
  );
}

/** A select that submits its form as soon as it changes (status pickers). */
export function AutoSelect({ name, value, options, label }: { name: string; value: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <select
      name={name}
      defaultValue={value}
      aria-label={label}
      className="a-select a-select--compact"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Live clock / auto refresh for the realtime card. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [seconds, router]);
  return null;
}
