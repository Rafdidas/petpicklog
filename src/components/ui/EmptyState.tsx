import type { ReactNode } from "react";

export default function EmptyState({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {title ? <strong>{title}</strong> : null}
      <p>{children}</p>
      {action ?? null}
    </div>
  );
}
