import { useRef } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/cn";

/**
 * Segmented tab control (WAI-ARIA tabs pattern, arrow-key navigation).
 * Render the matching panel yourself with {...tabPanelProps(idPrefix, id)}.
 */
export function Tabs({ items, value, onChange, idPrefix = "tabs", label, className }) {
  const refs = useRef({});

  const onKeyDown = (e) => {
    const i = items.findIndex((t) => t.id === value);
    const next = { ArrowRight: (i + 1) % items.length, ArrowLeft: (i - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[items[next].id]?.focus();
  };

  return (
    <div
      role="tablist" aria-label={label} onKeyDown={onKeyDown}
      className={cn("glass inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5 [scrollbar-width:none]", className)}
    >
      {items.map((t) => {
        const active = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id} ref={(el) => (refs.current[t.id] = el)} type="button" role="tab"
            id={`${idPrefix}-tab-${t.id}`} aria-selected={active} aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={active ? 0 : -1} onClick={() => onChange(t.id)}
            className={cn(
              "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 sm:px-5",
              active ? "text-espresso" : "text-mocha hover:text-espresso",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${idPrefix}-pill`} aria-hidden
                className="absolute inset-0 rounded-full bg-white shadow-[0_1px_0_#fff_inset,0_8px_18px_-8px_rgb(107_90_73/0.35)]"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {Icon && <Icon className="size-4" aria-hidden />}
              {t.label}
              {t.count != null && (
                <span className="rounded-full bg-sand/80 px-1.5 text-xs tabular-nums text-mocha">{t.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const tabPanelProps = (idPrefix, id) => ({
  role: "tabpanel", id: `${idPrefix}-panel-${id}`, "aria-labelledby": `${idPrefix}-tab-${id}`, tabIndex: 0,
});
