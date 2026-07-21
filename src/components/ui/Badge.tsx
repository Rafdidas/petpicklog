import type { ReactNode } from "react";

export default function Badge({ variant, children }: { variant: "drop" | "category" | "state"; children: ReactNode }) {
  return <span className={`ui-badge ui-badge--${variant}`}>{children}</span>;
}
