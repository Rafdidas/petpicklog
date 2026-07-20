import type { ReactNode } from "react";

export default function SectionHeading({ eyebrow, title, action, level = 2 }: { eyebrow: string; title: string; action?: ReactNode; level?: 1 | 2 }) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="ui-section-heading">
      <div>
        <p className="section-label">{eyebrow}</p>
        <Heading className="ui-section-heading__title">{title}</Heading>
      </div>
      {action ?? null}
    </div>
  );
}
