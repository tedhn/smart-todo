import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        warning:
          "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-900 border border-amber-200 " +
          "[a&]:hover:from-amber-200 [a&]:hover:to-amber-100 [a&]:hover:text-amber-950 " +
          "shadow-sm transition-all duration-200",

        success:
          "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-900 border border-emerald-200 " +
          "[a&]:hover:from-emerald-200 [a&]:hover:to-emerald-100 [a&]:hover:text-emerald-950 " +
          "shadow-sm transition-all duration-200",

        default:
          "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 border border-blue-200 " +
          "[a&]:hover:from-blue-200 [a&]:hover:to-blue-100 [a&]:hover:text-blue-950 " +
          "shadow-sm transition-all duration-200",

        secondary:
          "bg-gradient-to-r from-slate-200 to-slate-100 text-slate-900 border border-slate-300 " +
          "[a&]:hover:from-slate-300 [a&]:hover:to-slate-200 [a&]:hover:text-slate-950 " +
          "shadow-sm transition-all duration-200",

        destructive:
          "bg-gradient-to-r from-red-100 to-red-50 text-red-900 border border-red-200 " +
          "[a&]:hover:from-red-200 [a&]:hover:to-red-100 [a&]:hover:text-red-950 " +
          "shadow-sm transition-all duration-200",

        outline:
          "border border-slate-300 bg-white text-slate-700 " +
          "[a&]:hover:bg-slate-50 [a&]:hover:border-slate-400 " +
          "transition-all duration-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
