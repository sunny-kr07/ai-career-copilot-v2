import { ArrowRight, Check, Compass, FileDown, MessageCircle, PenLine, Target } from "lucide-react";
import { PageHeader } from "../../components/workspace/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { useSession } from "../../lib/store";
import { usePageTitle } from "../../lib/usePageTitle";

const SECTIONS = [
  {
    id: "analysis",
    icon: Target,
    eyebrow: "Section 1",
    title: "Resume analysis",
    text: "Paste a job description and see how your resume really measures up, then use that analysis to apply with confidence.",
    features: [
      { icon: Target, label: "Match score, skill gaps and bullet rewrites", to: "/app/analyze" },
      { icon: PenLine, label: "Tailored cover letter", to: "/app/letter" },
      { icon: MessageCircle, label: "Career copilot for interview prep", to: "/app/coach" },
      { icon: FileDown, label: "Shareable PDF report", to: "/app/report" },
    ],
    cta: { to: "/app/analyze", label: "Start analysis" },
  },
  {
    id: "jobs",
    icon: Compass,
    eyebrow: "Section 2",
    title: "Job finder",
    text: "No posting yet? Search job boards for roles that fit your resume, ranked by how well you match.",
    features: [
      { icon: Compass, label: "Search by role, location and recency", to: "/app/jobs" },
      { icon: Target, label: "Fit score for every result", to: "/app/jobs" },
      { icon: ArrowRight, label: "Send any job straight to analysis", to: "/app/jobs" },
    ],
    cta: { to: "/app/jobs", label: "Find jobs" },
  },
];

export default function Home() {
  usePageTitle("Workspace");
  const resume = useSession((s) => s.resume);
  const analysis = useSession((s) => s.analysis);
  const jobs = useSession((s) => s.jobs);
  const status = { analysis: !!analysis, jobs: !!jobs.results };

  return (
    <>
      <PageHeader eyebrow="Workspace" title="What would you like to do?">
        {resume
          ? "Your resume is ready. Choose a path below. The two sections work independently."
          : "Add your resume above, then choose a path. The two sections work independently."}
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-2">
        {SECTIONS.map(({ id, icon: Icon, eyebrow, title, text, features, cta }) => (
          <GlassCard key={id} as="section" aria-labelledby={`home-${id}`} strong padded="lg" hover className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/80 text-gold shadow-inset">
                <Icon className="size-6" aria-hidden />
              </span>
              {status[id] && <Badge tone="sage" icon={Check}>In progress</Badge>}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold">{eyebrow}</p>
            <h2 id={`home-${id}`} className="mt-1 text-3xl font-semibold">{title}</h2>
            <p className="mt-2 leading-relaxed text-mocha">{text}</p>
            <ul className="mt-5 space-y-2.5">
              {features.map(({ icon: F, label, to }) => (
                <li key={label} className="flex items-center gap-3 text-[15px] text-espresso">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sand/60 text-mocha"><F className="size-4" aria-hidden /></span>
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <Button to={cta.to} size="lg" iconRight={ArrowRight} className="w-full sm:w-auto">{cta.label}</Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
