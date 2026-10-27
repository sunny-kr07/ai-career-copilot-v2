import { useId } from "react";

/** Two-thumb range built from two native range inputs, so keyboard and screen readers just work. */
export function RangeSlider({ label, hint, min = 0, max = 15, value, onChange, format }) {
  const id = useId();
  const [lo, hi] = value;
  const pct = (v) => ((v - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span id={`${id}-label`} className="text-sm font-medium text-espresso">{label}</span>
        <output className="text-sm font-medium tabular-nums text-mocha" aria-live="polite">{format(lo, hi)}</output>
      </div>
      <div className="relative h-7" role="group" aria-labelledby={`${id}-label`}>
        <div className="field absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-champagne to-gold"
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
        />
        <input
          type="range" min={min} max={max} step={1} value={lo} aria-label={`${label}, minimum`}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          className="range-thumb absolute inset-0 h-full w-full" style={{ zIndex: lo > max - 2 ? 5 : 3 }}
        />
        <input
          type="range" min={min} max={max} step={1} value={hi} aria-label={`${label}, maximum`}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
          className="range-thumb absolute inset-0 h-full w-full" style={{ zIndex: 4 }}
        />
      </div>
      {hint && <p className="text-sm text-mocha">{hint}</p>}
    </div>
  );
}
