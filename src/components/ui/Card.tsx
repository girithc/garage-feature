import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-ink/10 bg-white/95 shadow-card backdrop-blur",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
