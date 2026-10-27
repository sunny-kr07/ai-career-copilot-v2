import { Compass, FileCheck2, Gauge, ListChecks, MessageCircle, PenLine, Wand2 } from "lucide-react";
import { Reveal } from "../../components/ui/Reveal";
import { cn } from "../../lib/cn";

const FEATURES = [
  { icon: Gauge, title: "An honest match score", span: "lg:col-span-4",
    text: "Four weighted dimensions, not a vibe: required skills 40%, experience level 25%, domain relevance 20% and keywords 15%. You see every number behind the total.",
    visual: "bars" },
  { icon: ListChecks, title: "Skill gaps, with receipts", span: "lg:col-span-2",
    text: "Every matched skill cites a line from your resume. Every gap comes with one practical way to close it." },
  { icon: Wand2, title: "Bullets that stay true", span: "lg:col-span-2",
    text: "Stronger rewrites that use only facts already in your resume. Missing metrics become [X%] placeholders for you to fill in, never guesses." },
  { icon: PenLine, title: "Cover letters, no bluffing", span: "lg:col-span-2",
    text: "Pick Confident, Warm or Formal. Gaps are framed positively and nothing is claimed beyond what your resume shows." },
  { icon: MessageCircle, title: "A coach that knows the job", span: "lg:col-span-2",
    text: "Ask about interviews, gaps or projects. Answers draw on your resume, the posting and your analysis." },
  { icon: Compass, title: "Jobs ranked against you", span: "lg:col-span-3",
    text: "Search Naukri, Indeed, LinkedIn, remote boards or Adzuna. Filter by recency and years of experience, then see an AI fit score for the top matches." },
  { icon: FileCheck2, title: "A report worth sharing", span: "lg:col-span-3",
    text: "A clean PDF with your score, evidence, gaps, keywords and rewrites, with your cover letter attached if you want it." },
];

function MiniBars() {
  return (
    <div aria-hidden className="mt-6 space-y-3">
      {[["Required skills", 78], ["Experience", 90], ["Domain", 84], ["Keywords", 70]].map(([l, v]) => (
        <div key={l} className="flex items-center gap-3 text-xs text-mocha">
          <span className="w-24 shrink-0">{l}</span>
          <div className="field h-2 flex-1 overflow-hidden rounded-full"><div className="h-full rounded-full bg-gradient-to-r from-champagne to-gold" style={{ width: `${v}%` }} /></div>
          <span className="w-6 text-right tabular-nums">{v}</span>
        </div>
      ))}
    </div>
  );
}

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Everything in one calm place</p>
          <h2 id="features-title" className="mt-3 text-4xl font-semibold sm:text-5xl">From first read to final application.</h2>
          <p className="mt-4 text-lg text-mocha">Seven tools that share one idea: help you present the truth about yourself, as well as it can be said.</p>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map(({ icon: Icon, title, text, span, visual }, i) => (
            <Reveal key={title} delay={(i % 3) * 0.06} className={cn("glass group rounded-[28px] p-6 transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:shadow-lift sm:p-7", span)}>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/80 text-gold shadow-inset transition-transform duration-500 group-hover:scale-105">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 leading-relaxed text-mocha">{text}</p>
              {visual === "bars" && <MiniBars />}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
