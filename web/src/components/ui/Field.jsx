import { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/cn";

export function FieldShell({ id, label, hint, error, optional, right, className, children }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-3">
          <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium text-espresso">
            {label}
            {optional && <span className="ml-1.5 font-normal text-mocha/80">optional</span>}
          </label>
          {right}
        </div>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="flex items-start gap-1.5 text-sm text-clay">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-sm text-mocha">{hint}</p>
      ) : null}
    </div>
  );
}

const control =
  "w-full bg-transparent text-[15px] text-espresso outline-none placeholder:text-mocha/70 disabled:cursor-not-allowed";

export function Input({ label, hint, error, optional, icon: Icon, right, className, id: idProp, ...rest }) {
  const uid = useId();
  const id = idProp || uid;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} right={right} className={className}>
      <div className={cn("field field-focus flex items-center gap-3 rounded-2xl px-4", error && "ring-2 ring-clay/40")}>
        {Icon && <Icon className="size-4 shrink-0 text-mocha" aria-hidden />}
        <input
          id={id} className={cn(control, "h-12")} aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined} {...rest}
        />
      </div>
    </FieldShell>
  );
}

export function Textarea({ label, hint, error, optional, right, className, rows = 6, id: idProp, ...rest }) {
  const uid = useId();
  const id = idProp || uid;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} right={right} className={className}>
      <div className={cn("field field-focus rounded-2xl px-4 py-3", error && "ring-2 ring-clay/40")}>
        <textarea
          id={id} rows={rows} className={cn(control, "resize-y leading-relaxed")} aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined} {...rest}
        />
      </div>
    </FieldShell>
  );
}
