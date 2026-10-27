import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Briefcase, Check, Compass, ListChecks, MessageCircle, RefreshCw, Sparkles, Target, Wand2 } from "lucide-react";
import { AnalysisResults } from "../../components/analysis/AnalysisResults";
import { PageHeader } from "../../components/workspace/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Field";
import { GlassCard } from "../../components/ui/GlassCard";
import { Switch } from "../../components/ui/Switch";
import { Reveal } from "../../components/ui/Reveal";
import { api } from "../../lib/api";
import { getState, setState, useSession } from "../../lib/store";
import { useHealth } from "../../lib/useHealth";
import { usePageTitle } from "../../lib/usePageTitle";
import { hashInputs, wordCount } from "../../lib/utils";
import { cn } from "../../lib/cn";

const STEPS = ["Reading your resume and the job description", "Scoring skills, experience and keywords", "Drafting stronger bullet points", "Putting the report together"];
const TEASERS = [
  { icon: Target, title: "Match score", text: "See how well your resume fits the job, with an honest breakdown." },
  { icon: ListChecks, title: "Skill gaps", text: "Find the required skills and keywords your resume is missing." },
  { icon: Wand2, title: "Better bullets", text: "Stronger rewrites of your weakest bullets, with no invented facts." },
  { icon: MessageCircle, title: "Interview coach", text: "Practice tough questions and learn how to address your gaps." },
];

function Analyzing() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <GlassCard strong padded="lg" role="status" aria-live="polite" className="overflow-hidden">
      <h2 className="text-2xl font-semibold">Analyzing your fit…</h2>
      <p className="mt-1 text-mocha">This usually takes 10 to 30 seconds.</p>
      <div className="field mt-6 h-2 overflow-hidden rounded-full">
        <div className="h-full w-full animate-shimmer rounded-full bg-[linear-gradient(90deg,transparent,#d9b98c,transparent)] bg-[length:200%_100%]" />
      </div>
      <ol className="mt-6 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-3 text-[15px] transition-opacity duration-500", i > step ? "opacity-40" : "opacity-100")}>
            <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", i < step ? "bg-sage/15 text-sage" : i === step ? "bg-champagne/40 text-espresso" : "bg-sand/60 text-mocha")}>
              {i < step ? <Check className="size-3.5" aria-hidden /> : i === step ? <motion.span className="size-2 rounded-full bg-gold" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} /> : null}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}

function Check3({ ok, children }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className={cn("flex size-5 items-center justify-center rounded-full", ok ? "bg-sage/15 text-sage" : "bg-sand/70 text-mocha")}>{ok && <Check className="size-3" aria-hidden />}</span>
      <span className={ok ? "text-espresso" : "text-mocha"}>{children}</span>
    </li>
  );
}

export default function Analyze() {
  usePageTitle("Analyze a job");
  const resume = useSession((s) => s.resume);
  const jd = useSession((s) => s.jd);
  const jobTitle = useSession((s) => s.jobTitle);
  const analysis = useSession((s) => s.analysis);
  const analysisKey = useSession((s) => s.analysisKey);
  const secs = useSession((s) => s.analysisSecs);
  const flash = useSession((s) => s.flash);
  const { health } = useHealth();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});
  const [showText, setShowText] = useState(false);

  const minJd = health?.min_jd_chars ?? 100;
  const key = hashInputs(resume?.text || "", jd.trim());
  const stale = analysis && analysisKey !== key;
  const jdReady = jd.trim().length >= minJd;

  const run = async () => {
    const next = {};
    if (!resume) next.resume = "Add your resume above first.";
    if (!jdReady) next.jd = `Paste the full job description (at least ${minJd} characters).`;
    if (health && !health.api_key) next.key = "No API key found. Add GOOGLE_API_KEY to your .env file and restart the API.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setApiError(null);
    const started = Date.now();
    try {
      const result = await api.analyze(resume.text, jd.trim());
      setState({
        analysis: result, analysisKey: key, analysisSecs: Math.round((Date.now() - started) / 1000), flash: null,
        letter: { text: "", tone: getState().letter.tone, flagged: [] }, chat: [],
      });
    } catch (e) {
      setApiError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Resume analysis" title="Resume vs. job description">
        Paste a job posting and see exactly how your resume stacks up, with honest scores, evidence and fixes.
      </PageHeader>

      {flash && <Alert tone="success" className="mb-6" onDismiss={() => setState({ flash: null })}>{flash}</Alert>}

      <GlassCard padded="lg">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <Input
              label="Job title" optional icon={Briefcase} placeholder="e.g. Backend Engineer" value={jobTitle}
              onChange={(e) => setState({ jobTitle: e.target.value })}
            />
            <Textarea
              label="Job description" rows={12} value={jd} error={errors.jd}
              placeholder="Paste the full job description here, including the requirements…"
              onChange={(e) => { setState({ jd: e.target.value }); if (errors.jd) setErrors((x) => ({ ...x, jd: null })); }}
              right={<span className="text-sm tabular-nums text-mocha">{wordCount(jd).toLocaleString()} words</span>}
              hint={jd && !jdReady ? "Paste the complete posting for better results." : undefined}
            />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="font-sans text-sm font-semibold text-espresso">Ready to analyze</h2>
              <ul className="mt-3 space-y-3">
                <Check3 ok={!!resume}>Resume added</Check3>
                <Check3 ok={jdReady}>Job description added</Check3>
                <Check3 ok={!health || health.api_key}>API key found</Check3>
              </ul>
            </div>
            {resume && (
              <div>
                <Switch label="Show the text we extracted" description="Check that your resume was read correctly." checked={showText} onChange={setShowText} />
                {showText && (
                  <pre tabIndex={0} className="field mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl p-4 font-sans text-xs leading-relaxed text-mocha">
                    {resume.text.slice(0, 4000)}{resume.text.length > 4000 ? "\n…" : ""}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {(errors.resume || errors.key) && <Alert tone="error" className="mt-6">{errors.resume || errors.key}</Alert>}
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Button size="lg" icon={analysis ? RefreshCw : Sparkles} loading={loading} onClick={run}>{analysis ? "Re-analyze" : "Analyze my fit"}</Button>
          <p className="text-sm text-mocha">Usually 10 to 30 seconds.</p>
        </div>
      </GlassCard>

      {apiError && (
        <Alert tone="error" className="mt-6" title="The analysis didn’t finish">
          {apiError.message}
          {apiError.technical && (
            <details className="mt-2"><summary className="cursor-pointer text-xs underline">Show technical details</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs">{apiError.technical}</pre></details>
          )}
        </Alert>
      )}

      <div className="mt-8" aria-live="polite">
        {loading ? (
          <Analyzing />
        ) : analysis ? (
          <>
            {stale && (
              <Alert tone="warn" className="mb-6" action={<Button size="sm" variant="glass" onClick={run}>Re-analyze</Button>}>
                Your resume or job description changed after this analysis. Re-analyze to refresh the results.
              </Alert>
            )}
            <AnalysisResults analysis={analysis} secs={secs} />
          </>
        ) : (
          <Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {TEASERS.map(({ icon: Icon, title, text }) => (
                <GlassCard key={title} hover className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-gold shadow-inset"><Icon className="size-5" aria-hidden /></span>
                  <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-mocha">{text}</p></div>
                </GlassCard>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-mocha">
              Don’t have a posting yet? <Link to="/app/jobs" className="inline-flex items-center gap-1 font-medium text-espresso underline decoration-gold/60 underline-offset-4"><Compass className="size-3.5" aria-hidden />Discover jobs that match your resume</Link>
            </p>
          </Reveal>
        )}
      </div>
    </>
  );
}
