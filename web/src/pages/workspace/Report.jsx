import { useState } from "react";
import { CheckCircle2, FileDown } from "lucide-react";
import { NeedsAnalysis } from "../../components/workspace/NeedsAnalysis";
import { PageHeader } from "../../components/workspace/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { Switch } from "../../components/ui/Switch";
import { api, saveBlob } from "../../lib/api";
import { useSession } from "../../lib/store";
import { usePageTitle } from "../../lib/usePageTitle";

const slug = (t) => (t || "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 40) || "resume-audit";
const INSIDE = ["Overall score and breakdown", "Matched skills with evidence", "Missing skills and keywords", "Your bullet rewrites"];

export default function Report() {
  usePageTitle("PDF report");
  const resume = useSession((s) => s.resume);
  const analysis = useSession((s) => s.analysis);
  const jobTitle = useSession((s) => s.jobTitle);
  const letter = useSession((s) => s.letter);
  const [include, setInclude] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!analysis || !resume) return (<><PageHeader eyebrow="Resume analysis" title="PDF report" /><NeedsAnalysis resume={!!resume} what="The report" /></>);

  const download = async () => {
    setBusy(true); setError(null);
    try {
      const blob = await api.report({ analysis, job_title: jobTitle.trim(), cover_letter: include && letter.text ? letter.text : "" });
      saveBlob(blob, `resume-audit-${slug(jobTitle)}.pdf`);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader eyebrow="Resume analysis" title="PDF report">A clean, shareable audit of this analysis.</PageHeader>
      <GlassCard padded="lg" className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Inside the report</h2>
          <ul className="mt-4 space-y-3">
            {INSIDE.map((t) => <li key={t} className="flex items-center gap-3 text-mocha"><CheckCircle2 className="size-5 text-sage" aria-hidden />{t}</li>)}
          </ul>
        </div>
        <div className="space-y-6">
          <Switch label="Include my cover letter draft" description={letter.text ? "Adds a page to the report." : "Generate a cover letter first to enable this."} checked={include && !!letter.text} disabled={!letter.text} onChange={setInclude} />
          <Button size="lg" icon={FileDown} loading={busy} onClick={download}>Download PDF report</Button>
          {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}
          <p className="text-sm text-mocha">The report is generated in your session and is not stored anywhere.</p>
        </div>
      </GlassCard>
    </>
  );
}
