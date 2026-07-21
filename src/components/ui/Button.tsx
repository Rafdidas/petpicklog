import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "green-dark" | "danger-text";

type CommonProps = {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buttonClass({ variant = "primary", size = "md", className }: CommonProps) {
  return ["ui-button", `ui-button--${variant}`, size === "sm" ? "ui-button--sm" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
}

export default function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant, size, className, external, href, children, ...rest } = props;
    const cls = buttonClass({ variant, size, className, children });
    if (external) {
      return (
        <a className={cls} href={href} target="_blank" rel="noreferrer" {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link className={cls} href={href} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant, size, className, children, type, ...rest } = props;
  return (
    <button className={buttonClass({ variant, size, className, children })} type={type ?? "button"} {...rest}>
      {children}
    </button>
  );
}
