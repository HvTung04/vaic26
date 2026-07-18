import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        urgent: "bg-primary/15 text-primary",
        coral: "bg-coral-soft text-[#B23A1F]",
        lavender: "bg-lavender-soft text-[#6B3FCB]",
        lime: "bg-lime-soft text-[#5A7300]",
        mint: "bg-mint text-[#136B4E]",
        sky: "bg-sky text-[#1C5AAE]",
        neutral: "bg-cream-100 text-ink-soft",
        dark: "bg-ink text-cream",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
