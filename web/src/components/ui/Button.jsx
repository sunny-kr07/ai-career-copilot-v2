import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

const base =
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium select-none " +
  "transition-all duration-300 ease-[var(--ease-premium)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-espresso text-ivory shadow-primary hover:-translate-y-0.5 hover:shadow-primary-hover",
  champagne:
    "bg-gradient-to-b from-[#f3dfbd] to-champagne text-espresso shadow-champagne hover:-translate-y-0.5 hover:brightness-105",
  glass: "glass text-espresso hover:-translate-y-0.5 hover:bg-white/85",
  ghost: "text-mocha hover:bg-white/60 hover:text-espresso",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

/** Pill button. Renders a router Link when `to` is set, an anchor for `href`, otherwise a button. */
export function Button({
  variant = "primary", size = "md", to, href, loading = false, icon: Icon, iconRight: IconRight,
  className, children, disabled, type = "button", ...rest
}) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
      {IconRight && !loading && (
        <IconRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" aria-hidden />
      )}
    </>
  );
  if (to) return <Link to={to} className={cn(classes, "group/btn")} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={cn(classes, "group/btn")} {...rest}>{content}</a>;
  return (
    <button type={type} className={cn(classes, "group/btn")} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
