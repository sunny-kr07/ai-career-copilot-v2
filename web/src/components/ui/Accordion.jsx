import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "../../lib/cn";

export function Accordion({ items }) {
  const base = useId();
  const [open, setOpen] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="glass rounded-3xl">
            <h3 className="font-sans">
              <button
                type="button" aria-expanded={isOpen} aria-controls={`${base}-${i}`} id={`${base}-btn-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 rounded-3xl px-6 py-5 text-left text-[17px] font-medium text-espresso"
              >
                {item.q}
                <Plus className={cn("size-5 shrink-0 text-gold transition-transform duration-300", isOpen && "rotate-45")} aria-hidden />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${base}-${i}`} role="region" aria-labelledby={`${base}-btn-${i}`}
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"
                >
                  <p className="px-6 pb-6 leading-relaxed text-mocha">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
