import type { ReactNode } from "react";

export default function StatTile({ label, value, boxed = false }: { label: string; value: ReactNode; boxed?: boolean }) {
  return (
    <article className={boxed ? "ui-stat ui-stat--boxed" : "ui-stat"}>
      <span className="ui-stat__label">{label}</span>
      <strong className="ui-stat__value">{value}</strong>
    </article>
  );
}
