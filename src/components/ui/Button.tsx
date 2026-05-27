import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
  }
>;

export function Button({
  className,
  children,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[16px] px-5 py-3 text-sm font-semibold transition",
        variant === "primary" &&
          "bg-ember text-white hover:bg-rust disabled:bg-ember/60",
        variant === "secondary" &&
          "border border-ink/15 bg-white text-ink hover:border-ink/30 hover:bg-sand",
        variant === "ghost" && "bg-transparent text-ink hover:bg-ink/5",
        "disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
