"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { track } from "@/components/analytics/Tracker.tsx";
import type { ServiceId, CategoryId } from "@/data/services.ts";
import { getService } from "@/data/services.ts";
import type { BUDGETS, CHALLENGE_TYPES, SERVICE_AREAS, STAGES, TIMINGS } from "@/lib/enquiry-schema.ts";
import { BriefDialog } from "./BriefDialog.tsx";

export type ChallengeType = (typeof CHALLENGE_TYPES)[number];
export type Stage = (typeof STAGES)[number];
export type Area = (typeof SERVICE_AREAS)[number];
export type Budget = (typeof BUDGETS)[number];
export type Timing = (typeof TIMINGS)[number];

export interface BriefDraft {
  challengeType?: ChallengeType;
  challenge: string;
  stage?: Stage;
  areas: Area[];
  budget?: Budget;
  timing?: Timing;
  name: string;
  email: string;
  company: string;
  phone: string;
  serviceId?: ServiceId;
}

export const EMPTY_DRAFT: BriefDraft = {
  challenge: "",
  areas: [],
  name: "",
  email: "",
  company: "",
  phone: "",
};

export const STEP_ORDER = ["challenge", "stage", "areas", "budget", "contact", "review"] as const;
export type StepId = (typeof STEP_ORDER)[number];

interface OpenOptions {
  serviceId?: ServiceId;
  step?: StepId;
}

interface BriefContextValue {
  draft: BriefDraft;
  update: (patch: Partial<BriefDraft>) => void;
  reset: () => void;
  isOpen: boolean;
  initialStep: StepId;
  open: (options?: OpenOptions) => void;
  close: () => void;
}

const BriefContext = createContext<BriefContextValue | null>(null);

const STORAGE_KEY = "onyq.brief.v1";

const CATEGORY_TO_CHALLENGE: Record<CategoryId, ChallengeType> = {
  websites: "website",
  design: "brand",
  apps: "app",
  ai: "ai",
  marketing: "marketing",
  growth: "other",
  support: "website",
};

function readStored(): BriefDraft | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BriefDraft>;
    return { ...EMPTY_DRAFT, ...parsed, areas: Array.isArray(parsed.areas) ? parsed.areas : [] };
  } catch {
    return null;
  }
}

function writeStored(draft: BriefDraft) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable (private mode, blocked) — the draft simply isn't kept */
  }
}

export function BriefProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BriefDraft>(EMPTY_DRAFT);
  const [isOpen, setOpen] = useState(false);
  const [initialStep, setInitialStep] = useState<StepId>("challenge");
  const hydrated = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const stored = readStored();
    if (stored) setDraft(stored);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) writeStored(draft);
  }, [draft]);

  const update = useCallback((patch: Partial<BriefDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback(() => setDraft(EMPTY_DRAFT), []);

  const open = useCallback((options: OpenOptions = {}) => {
    returnFocus.current = (document.activeElement as HTMLElement) ?? null;
    track("brief_open", options.serviceId ? { service: options.serviceId } : undefined);
    if (options.serviceId) {
      const service = getService(options.serviceId);
      setDraft((d) => ({
        ...d,
        serviceId: options.serviceId,
        challengeType: d.challengeType ?? CATEGORY_TO_CHALLENGE[service.category],
        areas: d.areas.includes(service.category) ? d.areas : [...d.areas, service.category],
      }));
    }
    setInitialStep(options.step ?? "challenge");
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    const el = returnFocus.current;
    if (el && document.contains(el)) requestAnimationFrame(() => el.focus());
  }, []);

  const value = useMemo(
    () => ({ draft, update, reset, isOpen, initialStep, open, close }),
    [draft, update, reset, isOpen, initialStep, open, close],
  );

  return (
    <BriefContext.Provider value={value}>
      {children}
      {isOpen ? <BriefDialog /> : null}
    </BriefContext.Provider>
  );
}

export function useBrief(): BriefContextValue {
  const ctx = useContext(BriefContext);
  if (!ctx) throw new Error("useBrief must be used inside <BriefProvider>");
  return ctx;
}

/** First step whose required answers are still missing — used to resume a draft. */
export function firstIncompleteStep(d: BriefDraft): StepId {
  if (!d.challengeType || d.challenge.trim().length < 10) return "challenge";
  if (!d.stage) return "stage";
  return "areas";
}
