import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Download, FileDown, Gauge, ListChecks, MessageCircle, PenLine, Wand2 } from "lucide-react";
import { downloadText } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";
import { ScoreRing } from "../ui/ScoreRing";
import { Tabs, tabPanelProps } from "../ui/Tabs";
import { BreakdownBars } from "./BreakdownBars";
import { BulletFix } from "./BulletFix";
import { KeywordChips, MatchedSkill, MissingSkill } from "./SkillItems";

const ID = "results";

export function Heading({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-mocha">{subtitle}</p>}
    </div>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <GlassCard>
      <p className="text-sm text-mocha">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-mocha">{hint}</p>
    </GlassCard>
  );
}

const NEXT = [
  { to: "/app/letter", icon: PenLine, title: "Write a cover letter", text: "Grounded in your real experience." },
  { to: "/app/coach", icon: MessageCircle, title: "Practice with the coach", text: "Interview answers and gap strategy." },
  { to: "/app/report", icon: FileDown, title: "Download the report", text: "A clean PDF of this analysis." },
];

export function AnalysisResults({ analysis: a, secs }) {
  const [tab, setTab] = useState("overview");
  const required = a.missing_skills.filter((s) => s.importance === "required");
  const gaps = [...a.missing_skills].sort((x, y) => (x.importance !== "required") - (y.importance !== "required"));
  const total = a.matched_skills.length + a.missing_skills.length;

  const exportRewrites = () =>
    downloadText(a.bullet_fixes.map((b) => `ORIGINAL: ${b.original}\nIMPROVED: ${b.improved}\nWHY: ${b.reason}`).join("\n\n"), "bullet-rewrites.txt");

  return (
    <div>
      <Tabs
        idPrefix={ID} label="Analysis sections" value={tab} onChange={setTab}
        items={[
          { id: "overview", label: "Overview", icon: Gauge },
          { id: "skills", label: "Skills", icon: ListChecks, count: total },
          { id: "bullets", label: "Bullets", icon: Wand2, count: a.bullet_fixes.length },
        ]}
      />

      <div className="mt-6">
        {tab === "overview" && (
          <div {...tabPanelProps(ID, "overview")} className="space-y-6 outline-none">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <GlassCard strong className="flex flex-col items-center justify-center gap-4 text-center">
                <ScoreRing score={a.overall_score} caption={a.verdict} />
                <Badge tone={a.overall_score >= 75 ? "sage" : a.overall_score >= 50 ? "amber" : "clay"}>{a.verdict}</Badge>
              </GlassCard>
              <GlassCard>
                <Heading title="Summary" />
                <p className="mb-6 leading-relaxed text-espresso">{a.summary}</p>
                <BreakdownBars breakdown={a.score_breakdown} weights={a.weights} />
              </GlassCard>
            </div>
            {secs != null && <p className="text-sm text-mocha">Analyzed in {secs}s. Scores are AI estimates: use them as guidance, not a verdict.</p>}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile label="Match score" value={`${a.overall_score}%`} hint={a.verdict} />
              <StatTile label="Skills matched" value={total ? `${a.matched_skills.length} / ${total}` : "0"} hint="found in your resume" />
              <StatTile label="Required gaps" value={required.length} hint="must-have skills missing" />
              <StatTile label="Keywords missing" value={a.missing_keywords.length} hint="worth adding if true" />
            </div>
            <div>
              <Heading title="What to do next" />
              <div className="grid gap-4 md:grid-cols-3">
                {NEXT.map(({ to, icon: Icon, title, text }) => (
                  <Link key={to} to={to} className="group glass flex items-start gap-4 rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-gold shadow-inset"><Icon className="size-5" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-espresso">{title}</span>
                      <span className="block text-sm text-mocha">{text}</span>
                    </span>
                    <ArrowUpRight className="size-4 text-mocha transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "skills" && (
          <div {...tabPanelProps(ID, "skills")} className="space-y-8 outline-none">
            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard>
                <Heading title="What you already show" subtitle="Skills backed by evidence in your resume" />
                {a.matched_skills.length ? (
                  <ul className="space-y-3">{a.matched_skills.map((s) => <MatchedSkill key={s.skill} {...s} />)}</ul>
                ) : (
                  <p className="text-sm text-mocha">No matching skills were found. Check that the right resume and job were used.</p>
                )}
              </GlassCard>
              <GlassCard>
                <Heading title="Gaps to address" subtitle="Required skills are listed first" />
                {gaps.length ? (
                  <ul className="space-y-3">{gaps.map((s) => <MissingSkill key={s.skill} {...s} />)}</ul>
                ) : (
                  <p className="text-sm text-sage">No gaps found for this job.</p>
                )}
              </GlassCard>
            </div>
            <GlassCard>
              <Heading title="Keywords to consider adding" subtitle="Only add terms that honestly describe your experience" />
              <KeywordChips keywords={a.missing_keywords} />
            </GlassCard>
          </div>
        )}

        {tab === "bullets" && (
          <div {...tabPanelProps(ID, "bullets")} className="outline-none">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <Heading title="Stronger bullet points" subtitle="Rewrites use only facts already in your resume" />
              {a.bullet_fixes.length > 0 && <Button variant="glass" size="sm" icon={Download} onClick={exportRewrites}>Download rewrites (.txt)</Button>}
            </div>
            {a.bullet_fixes.length ? (
              <ul className="space-y-4">{a.bullet_fixes.map((b, i) => <BulletFix key={i} original={b.original} improved={b.improved} reason={b.reason} needsInput={b.needs_user_input} />)}</ul>
            ) : (
              <GlassCard><p className="text-sm text-mocha">No bullet rewrites were generated this time. Press Re-analyze to try again.</p></GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
