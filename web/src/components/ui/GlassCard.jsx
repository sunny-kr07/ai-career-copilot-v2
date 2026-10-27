import { cn } from "../../lib/cn";

const pad = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

/** Frosted surface. `strong` is the more opaque variant, `hover` adds a gentle lift. */
export function GlassCard({ as: Tag = "div", strong, hover, padded = "md", className, children, ...rest }) {
  return (
    <Tag
      className={cn(
        "rounded-[28px]", strong ? "glass-strong" : "glass", pad[padded],
        hover && "transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
