import {
  createElement,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";

export type TypographyType =
  | "display"
  | "headline"
  | "title"
  | "label"
  | "bodyBold"
  | "body"
  | "caption";

export type TypographySize = "xl" | "lg" | "md" | "sm" | "xs";

type TypographyVariant =
  | { type: "display"; size: TypographySize }
  | { type: "headline"; size: "md" | "sm" }
  | { type: "title"; size: "lg" | "md" | "sm" | "xs" }
  | { type: "label"; size: TypographySize }
  | { type: "bodyBold"; size: "xl" | "lg" | "md" }
  | { type: "body"; size: TypographySize }
  | { type: "caption"; size: "lg" | "md" | "sm" };

type TypographyOwnProps<T extends ElementType> = TypographyVariant & {
  as?: T;
  children: ReactNode;
  className?: string;
};

export type TypographyProps<T extends ElementType = "span"> =
  TypographyOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof TypographyOwnProps<T> | "as">;

function toClassType(type: TypographyType) {
  return type === "bodyBold" ? "body-bold" : type;
}

export default function Typography<T extends ElementType = "span">({
  as,
  type,
  size,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const classes = [
    "ui-typography",
    `ui-typography--${toClassType(type)}`,
    `ui-typography--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createElement(as ?? "span", { ...rest, className: classes }, children);
}
