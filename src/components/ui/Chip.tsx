import type { ButtonHTMLAttributes } from "react";

export default function Chip({ active = false, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  const cls = ["ui-chip", active ? "ui-chip--active" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <button className={cls} type="button" {...rest}>
      {children}
    </button>
  );
}
