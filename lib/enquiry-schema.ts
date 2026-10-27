import { z } from "zod";
import { services, type ServiceId } from "../data/services.ts";

const SERVICE_IDS = services.map((s) => s.id) as [ServiceId, ...ServiceId[]];

export const CHALLENGE_TYPES = [
  "website",
  "store",
  "app",
  "ai",
  "marketing",
  "brand",
  "other",
] as const;

export const STAGES = ["new-idea", "existing-product", "process"] as const;

export const SERVICE_AREAS = [
  "websites",
  "design",
  "apps",
  "ai",
  "marketing",
  "growth",
  "support",
] as const;

export const BUDGETS = ["under-1k", "1k-5k", "5k-15k", "15k-plus", "not-sure"] as const;
export const TIMINGS = ["asap", "1-3-months", "flexible"] as const;

export const enquirySchema = z.object({
  challengeType: z.enum(CHALLENGE_TYPES),
  challenge: z
    .string()
    .trim()
    .min(10, "challenge_short")
    .max(2000, "challenge_long"),
  stage: z.enum(STAGES),
  areas: z.array(z.enum(SERVICE_AREAS)).max(SERVICE_AREAS.length).default([]),
  budget: z.enum(BUDGETS).optional(),
  timing: z.enum(TIMINGS).optional(),
  name: z.string().trim().min(2, "name_required").max(120, "name_long"),
  email: z.string().trim().max(200, "email_invalid").pipe(z.email("email_invalid")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  /** Set when the brief was opened from a specific price entry. */
  serviceId: z.enum(SERVICE_IDS).optional(),
  locale: z.enum(["en", "ru", "hy"]).default("en").catch("en"),
  /** Page the brief was sent from (for the admin inbox). */
  page: z
    .string()
    .max(300)
    .regex(/^\/(?![\/\\])[A-Za-z0-9\-._~%!$&'()*+,;=:@/]*$/)
    .optional()
    .catch(undefined),
  /** Honeypot — people leave it empty; the API silently drops submissions that fill it. */
  website: z.string().max(500).optional(),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

/** Field groups validated before moving to the next step. */
export const STEP_FIELDS = {
  challenge: ["challengeType", "challenge"],
  stage: ["stage"],
  areas: ["areas"],
  budget: ["budget", "timing"],
  contact: ["name", "email", "company", "phone"],
} as const;
