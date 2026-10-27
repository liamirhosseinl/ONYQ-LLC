"use client";

import { createContext, useContext, type ReactNode } from "react";

export type PublicContact = {
  salesEmail: string | null;
  telegram: string | null;
  whatsapp: string | null;
  phone: string | null;
  social: { label: string; url: string }[];
};

const Ctx = createContext<PublicContact>({ salesEmail: null, telegram: null, whatsapp: null, phone: null, social: [] });

/** Contact details edited in the admin panel, made available to client components. */
export function ContactProvider({ value, children }: { value: PublicContact; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContact() {
  return useContext(Ctx);
}
