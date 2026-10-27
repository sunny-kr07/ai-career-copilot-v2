import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, Clock, Compass, Globe, MapPin, Search, Sparkles, Target, Wand2 } from "lucide-react";
import { PageHeader } from "../../components/workspace/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { GlassCard } from "../../components/ui/GlassCard";
import { RangeSlider } from "../../components/ui/RangeSlider";
import { Select } from "../../components/ui/Select";
import { TagInput } from "../../components/ui/TagInput";
import { Switch } from "../../components/ui/Switch";
import { Tabs, tabPanelProps } from "../../components/ui/Tabs";
import { cn } from "../../lib/cn";
import { api } from "../../lib/api";
import { EXP_MAX, setJobs, setState, useSession } from "../../lib/store";
import { useHealth } from "../../lib/useHealth";
import { usePageTitle } from "../../lib/usePageTitle";

const ID = "jobmode";
const DAYS = [
  { value: 1, label: "Last 24 hours" }, { value: 3, label: "Last 3 days" }, { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" }, { value: 30, label: "Last 30 days" }, { value: 0, label: "Any time" },
];
const splitQueries = (text) => text.split(",").map((s) => s.trim()).filter(Boolean);
const safeUrl = (url) => (/^https?:\/\//i.test(url || "") ? url : null);
const tone = (score) => (score >= 75 ? "sage" : score >= 50 ? "amber" : "clay");

function JobCard({ job, onAnalyze }) {
  const url = safeUrl(job.url);
  const meta = [
    job.company && { icon: Building2, text: job.company }, job.location && { icon: MapPin, text: job.location },
    { icon: Clock, text: job.posted_label }, { icon: Target, text: job.experience },
  ].filter(Boolean);
  return (
    <li className="glass rounded-3xl p-5 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lift sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 basis-64 text-xl font-semibold">{job.title}</h3>
        {job.score != null && <Badge tone={tone(job.score)}>{job.ai_scored ? "AI fit" : "Keyword overlap"} {job.score}%</Badge>}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mocha">
        {meta.map(({ icon: Icon, text }) => <li key={text} className="flex items-center gap-1.5"><Icon className="size-3.5" aria-hidden />{text}</li>)}
        <li className="text-mocha/80">via {job.source}</li>
      </ul>
      {job.reason && <p className="mt-3 text-[15px] font-medium leading-relaxed text-espresso">{job.reason}</p>}
      <p className="mt-2 text-sm leading-relaxed text-mocha">{job.description.slice(0, 260)}{job.description.length > 260 ? "…" : ""}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {url && <Button href={url} target="_blank" rel="noopener noreferrer" size="sm" variant="glass" iconRight={ArrowUpRight}>Apply<span className="sr-only"> to {job.title} (opens in a new tab)</span></Button>}
        <Button size="sm" icon={Target} onClick={onAnalyze}>Analyze fit for this job</Button>
      </div>
    </li>
  );
}

export default function Jobs() {
  usePageTitle("Discover jobs");
  const navigate = useNavigate();
  const resume = useSession((s) => s.resume);
  const j = useSession((s) => s.jobs);
  const { health } = useHealth();
  const [busy, setBusy] = useState(null); // "roles" | "search" | null
  const [error, setError] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef();
  useEffect(() => () => clearInterval(timer.current), []);

  const maxQueries = health?.max_queries ?? 4;
  const sites = health?.sites ?? ["Naukri", "Indeed", "LinkedIn"];
  const modes = [
    { id: "jobsites", label: "Job boards", icon: Search }, { id: "remote", label: "Remote boards", icon: Globe },
    ...(health?.adzuna ? [{ id: "adzuna", label: "Adzuna", icon: Building2 }] : []),
  ];

  const suggest = async () => {
    setBusy("roles"); setError(null);
    try {
      const { roles } = await api.roles(resume.text);
      setJobs({ roles, query: roles.slice(0, 3).map((r) => r.replace(/,/g, " ").trim()).join(", ") });
      setQueryError(null);
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  };

  const tags = splitQueries(j.query);
  const setTags = (next) => { setJobs({ query: next.join(", ") }); setQueryError(null); };
  const addRole = (role) => {
    const r = role.replace(/,/g, " ").trim();
    if (!r || tags.some((c) => c.toLowerCase() === r.toLowerCase())) return;
    setTags([...tags, r].slice(0, maxQueries));
  };

  const search = async () => {
    if (!splitQueries(j.query).length) { setQueryError("Add at least one role or keyword to search for."); return; }
    if (j.mode === "jobsites" && !j.sites.length) { setError("Pick at least one job site."); return; }
    setBusy("search"); setError(null); setQueryError(null); setElapsed(0);
    timer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    try {
      const res = await api.jobs({
        resume: resume.text, query: j.query, mode: j.mode, where: j.where, sites: j.sites, fetch_description: j.fetchDescription,
        days: j.days, exp_lo: j.exp[0], exp_hi: j.exp[1], exp_strict: j.expStrict, use_ai: j.useAi,
      });
      setJobs({ results: res.jobs, total: res.total, notes: res.notes });
    } catch (e) { setError(e.message); } finally { clearInterval(timer.current); setBusy(null); }
  };

  const analyzeJob = (job) => {
    let msg = `Loaded “${job.title}” into the job description. Review it and press Analyze.`;
    if (job.description.length < 600) msg += " This is only a short snippet. Open the posting with Apply, copy the full description and paste it for a better analysis.";
    setState({ jd: job.description, jobTitle: job.title, flash: msg });
    navigate("/app/analyze");
  };

  const toggleSite = (s) => setJobs({ sites: j.sites.includes(s) ? j.sites.filter((x) => x !== s) : [...j.sites, s] });

  return (
    <>
      <PageHeader eyebrow="Find jobs" title="Find jobs that fit you">
        Search the boards, then see every posting ranked against your resume. Apply opens the original listing.
      </PageHeader>

      {!resume ? (
        <GlassCard strong padded="lg" className="text-center">
          <h2 className="text-2xl font-semibold">Add your resume first</h2>
          <p className="mt-2 text-mocha">Jobs are matched against it. Upload it, or try the sample, using the bar above.</p>
        </GlassCard>
      ) : (
        <>
          <GlassCard padded="lg">
            <Tabs idPrefix={ID} label="Where to look" value={j.mode} onChange={(mode) => setJobs({ mode })} items={modes} />
            <div {...tabPanelProps(ID, j.mode)} className="mt-6 space-y-6 outline-none">
              <div className="rounded-3xl bg-white/50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-espresso">Not sure what to search for?</p>
                    <p className="text-sm text-mocha">We’ll read your resume and propose job titles worth trying.</p>
                  </div>
                  <Button variant="glass" size="sm" icon={Wand2} loading={busy === "roles"} onClick={suggest}>Suggest roles from my resume</Button>
                </div>
                {j.roles.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm text-mocha">Suggested for your resume. Select one to add it to your search:</p>
                    <ul className="flex flex-wrap gap-2">
                      {j.roles.map((r) => (
                        <li key={r}><button type="button" onClick={() => addRole(r)} className="rounded-full bg-champagne/20 px-4 py-2 text-sm font-medium text-[#6e5226] ring-1 ring-inset ring-champagne/50 transition hover:bg-champagne/40">+ {r}</button></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <TagInput
                  label={`Roles or keywords (up to ${maxQueries})`} icon={Search} tags={tags} onChange={setTags} max={maxQueries} error={queryError}
                  hint="Type a role and press Enter to add it as a tag."
                  placeholder="e.g. Python developer" className={j.mode === "remote" ? "md:col-span-2" : ""}
                />
                {j.mode !== "remote" && <Input label="Location" icon={MapPin} value={j.where} placeholder="e.g. Pune" onChange={(e) => setJobs({ where: e.target.value })} />}
              </div>

              {j.mode === "jobsites" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-espresso" id="sites-label">Sites</p>
                  <ul className="flex flex-wrap gap-2" aria-labelledby="sites-label">
                    {sites.map((s) => {
                      const on = j.sites.includes(s);
                      return (
                        <li key={s}>
                          <button type="button" aria-pressed={on} onClick={() => toggleSite(s)} className={cn("rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300", on ? "bg-espresso text-ivory shadow-primary" : "glass text-mocha hover:text-espresso")}>{s}</button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-sm text-mocha">These sites don’t offer a public API, so this reads their public search pages. Indeed and Naukri work best; LinkedIn often rate-limits after a few searches. Each role is a separate search.</p>
                </div>
              )}
              {j.mode === "remote" && <p className="text-sm text-mocha">Remote jobs from Jobicy and Himalayas, no account needed. Each posting says where you may work from, so check before applying.</p>}

              <div className="grid gap-6 md:grid-cols-2">
                <Select label="Posted within" icon={Clock} value={j.days} onChange={(days) => setJobs({ days })} options={DAYS} />
                <RangeSlider
                  label="Years of experience asked" min={0} max={EXP_MAX} value={j.exp} onChange={(exp) => setJobs({ exp })}
                  format={(lo, hi) => (lo === 0 && hi === EXP_MAX ? "Any" : `${lo} to ${hi >= EXP_MAX ? `${EXP_MAX}+` : hi} years`)}
                  hint="Leave at the full range for no filter."
                />
              </div>

              <div className="grid gap-5 border-t border-white/70 pt-6 md:grid-cols-2">
                {j.mode === "jobsites" && <Switch label="Fetch full descriptions" description="Slower, but ranking and the experience filter work much better." checked={j.fetchDescription} onChange={(v) => setJobs({ fetchDescription: v })} />}
                <Switch label="Hide postings that don’t state experience" description="Reads phrases like “3+ years” and words like Senior in the title. A best guess, so check each posting." checked={j.expStrict} onChange={(v) => setJobs({ expStrict: v })} />
                <Switch label="Score the top 10 with AI" description="One extra model call for a proper fit score and reason." checked={j.useAi} onChange={(v) => setJobs({ useAi: v })} />
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Button size="lg" icon={Sparkles} loading={busy === "search"} onClick={search}>Find jobs</Button>
                {busy === "search" && <p role="status" className="text-sm text-mocha">Searching… {elapsed}s. Job sites can take 30 to 90 seconds per search.</p>}
              </div>
            </div>
          </GlassCard>

          {error && <Alert tone="error" className="mt-6" onDismiss={() => setError(null)}>{error}</Alert>}
          {j.notes.length > 0 && <div className="mt-6 space-y-3">{j.notes.map((n) => <Alert key={n} tone="warn">{n}</Alert>)}</div>}

          {j.results && (
            <section className="mt-8" aria-labelledby="results-title" aria-live="polite">
              <h2 id="results-title" className="text-2xl font-semibold">{j.results.length ? `${j.total ?? j.results.length} jobs found` : "No jobs found"}</h2>
              {j.results.length > 0 ? (
                <>
                  <p className="mb-5 mt-1 text-sm text-mocha">Scores are estimates: check each posting yourself.</p>
                  <ul className="space-y-4">{j.results.map((job, i) => <JobCard key={`${job.url}-${i}`} job={job} onAnalyze={() => analyzeJob(job)} />)}</ul>
                </>
              ) : (
                <GlassCard className="mt-4 flex items-center gap-4"><Compass className="size-6 text-gold" aria-hidden /><p className="text-mocha">Try broader keywords, a longer time window or a different source.</p></GlassCard>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
