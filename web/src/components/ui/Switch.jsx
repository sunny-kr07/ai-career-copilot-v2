import { useId } from "react";
import { cn } from "../../lib/cn";

export function Switch({ checked, onChange, label, description, disabled, className }) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4", disabled && "opacity-55", className)}>
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer select-none">
        <span className="block text-sm font-medium text-espresso">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-mocha">{description}</span>}
      </label>
      <button
        id={id} type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full border border-white/80 transition-colors duration-300",
          checked ? "bg-espresso" : "bg-sand/80 shadow-inset",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-0.5 top-0.5 size-6 rounded-full bg-gradient-to-b from-white to-cream shadow-[0_3px_8px_rgb(43_36_29/0.3)] transition-transform duration-300 ease-[var(--ease-premium)]",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
