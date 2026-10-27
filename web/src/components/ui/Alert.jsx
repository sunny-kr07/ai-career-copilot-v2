import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "../../lib/cn";

const tones = {
  error: { icon: AlertCircle, cls: "bg-clay/8 text-clay ring-clay/20" },
  warn: { icon: AlertTriangle, cls: "bg-amber/8 text-amber ring-amber/25" },
  info: { icon: Info, cls: "bg-white/60 text-mocha ring-white" },
  success: { icon: CheckCircle2, cls: "bg-sage/8 text-sage ring-sage/25" },
};

export function Alert({ tone = "info", title, children, action, onDismiss, className }) {
  const { icon: Icon, cls } = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm ring-1 ring-inset", cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
      {action}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-m-1 rounded-full p-1 opacity-70 transition hover:opacity-100">
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
