import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Logo } from "./Logo";

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#product", label: "Preview" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="relative mx-auto max-w-6xl">
        <div
          className={cn(
            "flex items-center justify-between rounded-full py-2 pl-4 pr-2 transition-all duration-500 sm:pl-5",
            scrolled ? "glass-strong" : "glass",
          )}
        >
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm font-medium text-mocha transition-colors hover:bg-white/70 hover:text-espresso">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button to="/app" size="sm" className="max-sm:hidden">Open workspace</Button>
            <button
              type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="glass flex size-10 items-center justify-center rounded-full text-espresso md:hidden"
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute inset-x-0 top-[calc(100%+8px)] rounded-3xl p-3 md:hidden"
            >
              <nav aria-label="Mobile">
                <ul className="flex flex-col">
                  {NAV_LINKS.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-[17px] font-medium text-espresso hover:bg-white/70">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <Button to="/app" className="mt-2 w-full">Open workspace</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
