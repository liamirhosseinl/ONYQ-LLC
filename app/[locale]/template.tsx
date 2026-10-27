import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/PageTransition.tsx";

/** Re-mounted on every navigation, so each page enters behind the route curtain. */
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
