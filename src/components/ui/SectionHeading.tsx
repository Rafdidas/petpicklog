import type { ReactNode } from "react";
import Typography from "./Typography";

export default function SectionHeading({ eyebrow, title, action, level = 2 }: { eyebrow: string; title: string; action?: ReactNode; level?: 1 | 2 }) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="ui-section-heading">
      <div>
        <Typography as="p" type="label" size="xs" className="section-label">{eyebrow}</Typography>
        <Typography as={Heading} type="headline" size={level === 1 ? "md" : "sm"} className="ui-section-heading__title">{title}</Typography>
      </div>
      {action ?? null}
    </div>
  );
}
