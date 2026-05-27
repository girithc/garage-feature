import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[14px] border border-ink/10 bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
