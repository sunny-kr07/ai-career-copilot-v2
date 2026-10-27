import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { FieldShell } from "./Field";

/** Accessible single-select dropdown (listbox pattern) with full keyboard support. */
export function Select({ label, hint, value, onChange, options, className, icon: Icon }) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const button = useRef(null);
  const list = useRef(null);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[index];

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const away = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const openList = () => { setActive(index); setOpen(true); };
  const close = (refocus = true) => { setOpen(false); if (refocus) button.current?.focus(); };
  const choose = (i) => { onChange(options[i].value); close(); };

  const onButtonKey = (e) => {
    if (["ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); openList(); }
  };
  const onListKey = (e) => {
    const last = options.length - 1;
    const moves = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last };
    if (e.key in moves) { e.preventDefault(); setActive(moves[e.key]); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") close(false);
  };

  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <div ref={root} className="relative">
        <button
          ref={button} id={id} type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-label ${id}-value`} aria-controls={listId}
          onClick={() => (open ? close() : openList())} onKeyDown={onButtonKey}
          className="field field-focus flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-[15px] text-espresso"
        >
          {Icon && <Icon className="size-4 shrink-0 text-mocha" aria-hidden />}
          <span id={`${id}-value`} className="flex-1 truncate">{selected?.label}</span>
          <ChevronDown className={cn("size-4 text-mocha transition-transform duration-300", open && "rotate-180")} aria-hidden />
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul
              ref={list} id={listId} role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`${id}-opt-${active}`}
              onKeyDown={onListKey}
              initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-64 overflow-auto rounded-2xl p-1.5 outline-none"
            >
              {options.map((o, i) => (
                <li
                  key={String(o.value)} id={`${id}-opt-${i}`} role="option" aria-selected={o.value === value}
                  onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px] text-espresso transition-colors",
                    i === active && "bg-sand/70",
                  )}
                >
                  {o.label}
                  {o.value === value && <Check className="size-4 text-gold" aria-hidden />}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </FieldShell>
  );
}
