import type { ButtonHTMLAttributes } from "react";
import Typography from "./Typography";

export default function Chip({ active = false, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  const cls = ["ui-chip", active ? "ui-chip--active" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <button className={cls} type="button" {...rest}>
      <Typography type="label" size="sm">{children}</Typography>
    </button>
  );
}
