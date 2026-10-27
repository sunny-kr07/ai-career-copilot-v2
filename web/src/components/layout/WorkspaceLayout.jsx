import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Compass, LayoutGrid, Lock, FileDown, MessageCircle, PenLine, ShieldCheck, Target, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { resetSession, useSession } from "../../lib/store";
import { useHealth } from "../../lib/useHealth";
import { Alert } from "../ui/Alert";
import { Background } from "./Background";
import { Logo } from "./Logo";
import { ResumeBar } from "./ResumeBar";

// Two distinct feature sections: everything that works on a job description, and job discovery.
const SECTIONS = [
  {
    id: "analysis", label: "Resume analysis", short: "Analysis", icon: Target,
    blurb: "Match your resume to a job description",
    items: [
      { to: "/app/analyze", label: "Analyze a job", short: "Analyze", icon: Target, hint: "Resume vs. job description" },
      { to: "/app/letter", label: "Cover letter", needsAnalysis: true, short: "Letter", icon: PenLine, hint: "Honest, tailored drafts" },
      { to: "/app/coach", label: "Career copilot", needsAnalysis: true, short: "Copilot", icon: MessageCircle, hint: "Practice and prepare" },
      { to: "/app/report", label: "PDF report", needsAnalysis: true, short: "Report", icon: FileDown, hint: "A shareable audit" },
    ],
  },
  {
    id: "jobs", label: "Job finder", short: "Job finder", icon: Compass,
    blurb: "Discover roles that fit your resume",
    items: [{ to: "/app/jobs", label: "Discover jobs", short: "Jobs", icon: Compass, hint: "Roles that fit your resume" }],
  },
];

function useSection() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/app/jobs")) return SECTIONS[1];
  if (pathname === "/app" || pathname === "/app/") return null; // workspace home
  return SECTIONS[0];
}

const itemCls = (active) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    active ? "bg-white text-espresso shadow-[0_1px_0_#fff_inset,0_8px_18px_-12px_rgb(107_90_73/0.5)]" : "text-espresso/90 hover:bg-white/60",
  );

function useDone() {
  const analysis = useSession((s) => s.analysis);
  const jobs = useSession((s) => s.jobs);
  const letter = useSession((s) => s.letter);
  const chat = useSession((s) => s.chat);
  return {
    "/app/analyze": !!analysis,
    "/app/jobs": !!jobs.results,
    "/app/letter": !!letter.text,
    "/app/coach": chat.length > 0,
    "/app/report": false,
  };
}

function ClearSession() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const click = () => {
    if (!confirm) {
      setConfirm(true);
      timer.current = setTimeout(() => setConfirm(false), 4000);
      return;
    }
    resetSession();
    navigate("/app");
    setConfirm(false);
  };
  return (
    <button
      type="button" onClick={click}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        confirm ? "bg-clay/10 text-clay" : "text-mocha hover:bg-white/70 hover:text-espresso",
      )}
    >
      <Trash2 className="size-4" aria-hidden />
      {confirm ? "Click again to clear everything" : "Clear session"}
    </button>
  );
}

export function WorkspaceLayout() {
  const done = useDone();
  const analysis = useSession((s) => s.analysis);
  const { health, error } = useHealth();
  const section = useSection();

  return (
    <div className="relative isolate min-h-dvh">
      <Background />
      <a href="#main" className="sr-only z-[60] rounded-full bg-espresso px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>

      <div className="mx-auto flex max-w-[1400px] gap-2 lg:p-4">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="glass sticky top-4 flex h-[calc(100dvh-2rem)] flex-col overflow-y-auto rounded-[28px] p-4">
            <Logo className="px-1 pt-1" />

            <NavLink to="/app" end className={({ isActive }) => cn(itemCls(isActive), "mt-5")}>
              <LayoutGrid className="size-[18px] shrink-0" aria-hidden />
              <span className="flex-1">Workspace home</span>
            </NavLink>

            <div className="mt-5 space-y-5">
              {SECTIONS.map((sec) => (
                <nav key={sec.id} aria-labelledby={`nav-${sec.id}`}>
                  <p id={`nav-${sec.id}`} className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-mocha/80">
                    {sec.label}
                  </p>
                  <ul className="space-y-0.5">
                    {sec.items.map(({ to, end, label, icon: Icon, hint, needsAnalysis }) => {
                      const locked = needsAnalysis && !analysis;
                      return (
                        <li key={to}>
                          <NavLink to={to} end={end} title={locked ? "Run an analysis first" : hint} className={({ isActive }) => cn(itemCls(isActive), locked && !isActive && "text-mocha/70")}>
                            <Icon className="size-[18px] shrink-0" aria-hidden />
                            <span className="flex-1 truncate">{label}</span>
                            {done[to] ? (
                              <span className="flex size-5 items-center justify-center rounded-full bg-sage/15 text-sage">
                                <Check className="size-3" aria-hidden /><span className="sr-only">Done</span>
                              </span>
                            ) : locked ? (
                              <><Lock className="size-3.5 text-mocha/60" aria-hidden /><span className="sr-only">Run an analysis first</span></>
                            ) : null}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              ))}
            </div>

            <div className="mt-auto space-y-2 pt-6">
              {health && !health.api_key && (
                <Alert tone="error">No API key found. Add GOOGLE_API_KEY to your .env file and restart the API.</Alert>
              )}
              {error && <Alert tone="warn">API offline. Start it with <code className="font-mono text-xs">uvicorn api.server:app</code>.</Alert>}
              {health?.api_key && (
                <p className="flex items-center gap-2 px-3 text-xs text-mocha" title={`Model: ${health.model}`}>
                  <span className="size-1.5 rounded-full bg-sage" aria-hidden />Connected
                  <span className="truncate font-mono text-[11px] text-mocha/70">{health.model}</span>
                </p>
              )}
              <p className="flex items-start gap-2 px-3 text-[11px] leading-snug text-mocha">
                <ShieldCheck className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />
                Resume is sent to Gemini to generate results. Nothing is saved to disk.
              </p>
              <div className="space-y-0.5 border-t border-white/60 pt-2">
                <ClearSession />
                <NavLink to="/" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-mocha transition-colors hover:bg-white/70 hover:text-espresso">
                  <ArrowLeft className="size-4" aria-hidden /> Back to website
                </NavLink>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile header */}
          <header className="flex items-center justify-between px-4 pb-2 pt-4 sm:px-8 lg:hidden">
            <Logo />
            <NavLink to="/" className="glass rounded-full px-4 py-2 text-sm font-medium text-espresso">Website</NavLink>
          </header>
          {/* Mobile section switch */}
          {section && <div role="group" aria-label="Workspace section" className="glass mx-4 mt-2 flex gap-1 rounded-full p-1 sm:mx-8 lg:hidden">
            <NavLink to="/app" end aria-label="Workspace home" className="flex items-center justify-center rounded-full px-3 py-2 text-mocha">
              <LayoutGrid className="size-4" aria-hidden />
            </NavLink>
            {SECTIONS.map((sec) => (
              <NavLink
                key={sec.id} to={sec.items[0].to} end
                aria-current={section.id === sec.id ? "page" : undefined}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  section.id === sec.id ? "bg-espresso text-ivory" : "text-mocha",
                )}
              >
                <sec.icon className="size-4" aria-hidden />{sec.label}
              </NavLink>
            ))}
          </div>}
          <main id="main" tabIndex={-1} className="px-4 pb-32 pt-4 outline-none sm:px-8 lg:px-6 lg:pb-12 lg:pt-6">
            <div className="mx-auto max-w-5xl">
              {health && !health.api_key && (
                <Alert tone="error" className="mb-6 lg:hidden">No API key found. Add GOOGLE_API_KEY to your .env file and restart the API.</Alert>
              )}
              <ResumeBar />
              <Outlet />
              <p className="mt-12 text-center text-xs text-mocha lg:hidden">
                Your resume is sent to Google's Gemini API to generate results. Nothing is saved to disk.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation: features of the current section (only when it has several) */}
      {section && section.items.length > 1 && (
        <nav
          aria-label={section.label}
          className="glass-strong fixed inset-x-3 bottom-3 z-40 rounded-full p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden"
        >
          <ul className="flex justify-between">
            {section.items.map(({ to, end, short, icon: Icon }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to} end={end}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[11px] font-medium transition-colors",
                      isActive ? "bg-espresso text-ivory" : "text-mocha",
                    )
                  }
                >
                  <Icon className="size-[18px]" aria-hidden />
                  {short}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
