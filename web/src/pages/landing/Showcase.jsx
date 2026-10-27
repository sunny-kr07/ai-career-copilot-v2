import { useState } from "react";
import { Gauge, ListChecks, Wand2 } from "lucide-react";
import { BreakdownBars } from "../../components/analysis/BreakdownBars";
import { BulletFix } from "../../components/analysis/BulletFix";
import { KeywordChips, MatchedSkill, MissingSkill } from "../../components/analysis/SkillItems";
import { Badge } from "../../components/ui/Badge";
import { GlassCard } from "../../components/ui/GlassCard";
import { Reveal } from "../../components/ui/Reveal";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { Tabs, tabPanelProps } from "../../components/ui/Tabs";

const ID = "showcase";
const BREAKDOWN = { required_skills: 78, experience_level: 90, domain_relevance: 84, keywords: 70 };
const WEIGHTS = { required_skills: 40, experience_level: 25, domain_relevance: 20, keywords: 15 };

export function Showcase() {
  const [tab, setTab] = useState("overview");
  return (
    <section id="product" aria-labelledby="product-title" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Preview</p>
          <h2 id="product-title" className="mt-3 text-4xl font-semibold sm:text-5xl">See what you’ll get.</h2>
          <p className="mt-4 text-lg text-mocha">Sample output for the fictional demo resume: Alex Morgan applying for a Backend Engineer role.</p>
        </Reveal>
        <Reveal className="mt-10 flex justify-center">
          <Tabs
            idPrefix={ID} label="Sample analysis" value={tab} onChange={setTab}
            items={[{ id: "overview", label: "Match", icon: Gauge }, { id: "skills", label: "Skills", icon: ListChecks }, { id: "rewrites", label: "Rewrites", icon: Wand2 }]}
          />
        </Reveal>
        <div className="mt-8">
          {tab === "overview" && (
            <div {...tabPanelProps(ID, "overview")} className="grid gap-6 outline-none md:grid-cols-[260px_1fr]">
              <GlassCard strong className="flex flex-col items-center gap-4"><ScoreRing score={81} caption="Strong match" /><Badge tone="sage">Strong match</Badge></GlassCard>
              <GlassCard>
                <p className="mb-6 leading-relaxed">Solid backend foundation in Python, REST APIs and PostgreSQL that lines up well with the role. The main gap is Kubernetes, which the posting lists as required.</p>
                <BreakdownBars breakdown={BREAKDOWN} weights={WEIGHTS} />
              </GlassCard>
            </div>
          )}
          {tab === "skills" && (
            <div {...tabPanelProps(ID, "skills")} className="grid gap-6 outline-none md:grid-cols-2">
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold">What you already show</h3>
                <ul className="space-y-3">
                  <MatchedSkill skill="Python and REST API design" evidence="Built REST APIs in Python and Flask serving 50k users." />
                  <MatchedSkill skill="PostgreSQL" evidence="Worked with PostgreSQL and Docker for backend development." />
                </ul>
              </GlassCard>
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold">Gaps to address</h3>
                <ul className="space-y-3">
                  <MissingSkill skill="Kubernetes" importance="required" suggestion="Deploy a small side project to a local cluster, then add it to your resume once it’s true." />
                  <MissingSkill skill="CI/CD pipelines" importance="preferred" suggestion="Add a simple test-and-build workflow to one of your repositories." />
                </ul>
                <h3 className="mb-3 mt-6 text-lg font-semibold">Keywords to consider</h3>
                <KeywordChips keywords={["Kubernetes", "AWS", "Prometheus"]} />
              </GlassCard>
            </div>
          )}
          {tab === "rewrites" && (
            <ul {...tabPanelProps(ID, "rewrites")} className="space-y-4 outline-none">
              <BulletFix original="Wrote unit tests with pytest." improved="Wrote pytest unit tests for backend services, reaching [X%] coverage." reason="Adds scope and a measurable result without inventing either." needsInput />
              <BulletFix original="Fixed bugs and wrote SQL queries for reporting." improved="Fixed production bugs and wrote SQL queries that powered team reporting." reason="Stronger verbs and clearer impact, using only what the original already says." needsInput={false} />
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
