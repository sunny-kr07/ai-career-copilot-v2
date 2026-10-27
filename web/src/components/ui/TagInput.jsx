import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { FieldShell } from "./Field";

const clean = (s) => s.replace(/,/g, " ").replace(/\s+/g, " ").trim();

/** Search-box style input where each entry becomes a removable tag. Enter (or leaving the field) adds one. */
export function TagInput({ label, hint, error, icon: Icon, tags, onChange, max = 4, placeholder, className, id: idProp }) {
  const uid = useId();
  const id = idProp || uid;
  const [draft, setDraft] = useState("");
  const ref = useRef(null);
  const full = tags.length >= max;

  const commit = () => {
    const value = clean(draft);
    setDraft("");
    if (!value || full || tags.some((t) => t.toLowerCase() === value.toLowerCase())) return;
    onChange([...tags, value]);
  };
  const remove = (i) => onChange(tags.filter((_, k) => k !== i));

  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "Backspace" && !draft && tags.length) remove(tags.length - 1);
  };

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div
        onClick={() => ref.current?.focus()}
        className={cn("field field-focus flex min-h-12 cursor-text flex-wrap items-center gap-2 rounded-2xl px-4 py-2", error && "ring-2 ring-clay/40")}
      >
        {Icon && <Icon className="size-4 shrink-0 text-mocha" aria-hidden />}
        {tags.map((t, i) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-3 pr-1.5 text-sm font-medium text-espresso shadow-[0_1px_0_#fff_inset,0_4px_10px_-6px_rgb(107_90_73/0.5)] ring-1 ring-sand">
            {t}
            <button
              type="button" onClick={(e) => { e.stopPropagation(); remove(i); }} aria-label={`Remove ${t}`}
              className="flex size-5 items-center justify-center rounded-full text-mocha transition-colors hover:bg-sand/70 hover:text-espresso"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={ref} id={id} value={draft} disabled={full}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} onBlur={commit}
          placeholder={full ? "" : tags.length ? "Add another…" : placeholder}
          aria-invalid={!!error || undefined} aria-describedby={error || hint ? `${id}-msg` : undefined}
          className="h-8 min-w-[9rem] flex-1 bg-transparent text-[15px] text-espresso outline-none placeholder:text-mocha/70 disabled:cursor-not-allowed"
        />
      </div>
    </FieldShell>
  );
}
