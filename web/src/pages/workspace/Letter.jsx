import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, PenLine, RefreshCw } from "lucide-react";
import { NeedsAnalysis } from "../../components/workspace/NeedsAnalysis";
import { PageHeader } from "../../components/workspace/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Field";
import { GlassCard } from "../../components/ui/GlassCard";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import { setState, useSession } from "../../lib/store";
import { usePageTitle } from "../../lib/usePageTitle";
import { copyText, downloadText, wordCount } from "../../lib/utils";

const TONES = ["Confident", "Warm", "Formal"].map((t) => ({ value: t, label: t }));

export default function Letter() {
  usePageTitle("Cover letter");
  const resume = useSession((s) => s.resume);
  const jd = useSession((s) => s.jd);
  const analysis = useSession((s) => s.analysis);
  const letter = useSession((s) => s.letter);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const checked = useRef(letter.text);

  const patch = (p) => setState((s) => ({ letter: { ...s.letter, ...p } }));

  // Re-check for gap-pointing wording a moment after the user stops editing.
  useEffect(() => {
    if (!letter.text || letter.text === checked.current) return;
    const t = setTimeout(async () => {
      try {
        const { flagged } = await api.checkLetter(letter.text);
        checked.current = letter.text;
        patch({ flagged });
      } catch { /* the check is advisory; ignore failures */ }
    }, 700);
    return () => clearTimeout(t);
  }, [letter.text]);

  if (!analysis || !resume) return (<><PageHeader eyebrow="Resume analysis" title="Cover letter" /><NeedsAnalysis resume={!!resume} what="A cover letter" /></>);

  const generate = async () => {
    setBusy(true); setError(null);
    try {
      const { text, flagged } = await api.letter({ resume: resume.text, jd, analysis, tone: letter.tone });
      checked.current = text;
      patch({ text, flagged });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const copy = async () => { if (await copyText(letter.text)) { setCopied(true); setTimeout(() => setCopied(false), 1800); } };
  const hasPlaceholders = /\[Company\]|\[Your Name\]/.test(letter.text);

  return (
    <>
      <PageHeader eyebrow="Resume analysis" title="Cover letter">Built from your real experience. Gaps are handled positively, never invented away.</PageHeader>
      <GlassCard padded="lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <Select label="Tone" className="sm:w-64" value={letter.tone} onChange={(tone) => patch({ tone })} options={TONES} />
          <Button size="lg" icon={letter.text ? RefreshCw : PenLine} loading={busy} onClick={generate}>{letter.text ? "Regenerate letter" : "Generate cover letter"}</Button>
        </div>
        {busy && <p role="status" className="mt-4 text-sm text-mocha">Writing your letter… about 10 to 20 seconds.</p>}
        {error && <Alert tone="error" className="mt-5" onDismiss={() => setError(null)}>{error}</Alert>}

        {letter.text ? (
          <div className="mt-8 space-y-4">
            <Textarea label="Your letter (edit freely)" rows={16} value={letter.text} onChange={(e) => patch({ text: e.target.value })} right={<span className="text-sm tabular-nums text-mocha">{wordCount(letter.text)} words</span>} />
            {letter.flagged.length > 0 && <Alert tone="warn">The draft contains wording that points at a gap ({letter.flagged.join(", ")}). Consider rewording it positively.</Alert>}
            {hasPlaceholders && <Alert tone="info">Replace the bracketed placeholders, such as [Company], before sending.</Alert>}
            <p className="text-sm text-mocha">Always read the letter and make sure every claim is true for you.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="glass" icon={copied ? Check : Copy} onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
              <Button variant="glass" icon={Download} onClick={() => downloadText(letter.text, "cover-letter.txt")}>Download .txt</Button>
            </div>
          </div>
        ) : (
          !busy && <Alert tone="info" className="mt-6">Press Generate to write a first draft. You can edit it freely afterwards.</Alert>
        )}
      </GlassCard>
    </>
  );
}
