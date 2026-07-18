import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-[0_4px_14px_-2px_rgba(59,130,246,0.45)] hover:bg-primary/90 hover:shadow-[0_6px_18px_-2px_rgba(59, 130, 246, 0.55)] focus-visible:ring-primary/40",
        secondary:
          "bg-ink text-cream hover:bg-ink/90 focus-visible:ring-ink/30",
        outline:
          "border border-hairline bg-white text-ink hover:bg-cream-100 focus-visible:ring-ink/20",
        ghost: "text-ink-soft hover:bg-ink/5 focus-visible:ring-ink/15",
        success: "bg-ink text-lime hover:bg-ink/90 focus-visible:ring-lime/40",
        ember:
          "bg-ember text-white shadow-[0_4px_14px_-2px_rgba(193,68,14,0.45)] hover:bg-ember-dark focus-visible:ring-ember/40",
        lavender:
          "bg-lavender text-ink hover:bg-lavender/80 focus-visible:ring-lavender/50",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto rounded-none",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 shrink-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
