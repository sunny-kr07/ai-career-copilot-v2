import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

/** The Pearl Chat Loop mark (public/logo-96.png, drawn at 2x for sharp edges). */
export function LogoMark({ className }) {
  return (
    <img
      src="/logo-96.png" alt="" width={36} height={36} decoding="async" draggable={false}
      className={cn("size-9 rounded-[12px] object-cover shadow-[0_6px_16px_-8px_rgb(107_90_73/0.55)] ring-1 ring-white/70", className)}
    />
  );
}

export function Logo({ to = "/", className }) {
  return (
    <Link to={to} aria-label="AI Career Copilot, home" className={cn("flex items-center gap-2.5 rounded-full", className)}>
      <LogoMark />
      <span className="font-display text-[17px] font-semibold tracking-tight text-espresso">Career Copilot</span>
    </Link>
  );
}
