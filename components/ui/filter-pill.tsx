import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type FilterPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  count?: number;
};

export const FilterPill = forwardRef<HTMLButtonElement, FilterPillProps>(
  ({ active, count, className, children, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn("filter", active && "active", className)}
      aria-pressed={active}
      {...props}
    >
      {children}
      {typeof count === "number" && <span className="count">{count}</span>}
    </button>
  ),
);
FilterPill.displayName = "FilterPill";
