import { cn } from "../../lib/cn";

const tones = {
  neutral: "bg-white/70 text-mocha ring-white",
  gold: "bg-champagne/25 text-[#6e5226] ring-champagne/50",
  sage: "bg-sage/10 text-sage ring-sage/25",
  amber: "bg-amber/10 text-amber ring-amber/25",
  clay: "bg-clay/10 text-clay ring-clay/25",
};

export function Badge({ tone = "neutral", icon: Icon, className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset", tones[tone], className)}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}
