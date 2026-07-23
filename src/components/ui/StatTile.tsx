import type { ReactNode } from "react";
import Typography from "./Typography";

export default function StatTile({ label, value, boxed = false }: { label: string; value: ReactNode; boxed?: boolean }) {
  return (
    <article className={boxed ? "ui-stat ui-stat--boxed" : "ui-stat"}>
      <Typography as="span" type="caption" size="lg" className="ui-stat__label">{label}</Typography>
      <Typography as="strong" type="title" size="lg" className="ui-stat__value">{value}</Typography>
    </article>
  );
}
