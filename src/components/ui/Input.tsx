import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[14px] border border-ink/12 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-steel focus:border-ember focus:ring-2 focus:ring-ember/20",
        className
      )}
      {...props}
    />
  );
}
