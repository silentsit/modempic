import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.18em]",
  {
    variants: {
      variant: {
        /** Forest Green — trust / primary-action eyebrows */
        default: "bg-primary-subtle text-primary",
        /** Slate Blue — informational eyebrows */
        accent: "bg-accent-subtle text-accent",
        /** Plain text, no pill — for tight spaces */
        plain: "px-0 py-0 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
