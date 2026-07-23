import type { ReactNode } from "react";
import Typography from "./Typography";

export default function EmptyState({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {title ? <Typography as="strong" type="bodyBold" size="md">{title}</Typography> : null}
      <Typography as="p" type="body" size="sm">{children}</Typography>
      {action ?? null}
    </div>
  );
}
