import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Dropzone } from "../../components/ui/Dropzone";
import { Reveal } from "../../components/ui/Reveal";
import { useResume } from "../../lib/useResume";

export function FinalCta() {
  const navigate = useNavigate();
  const { upload, loadSample, busy, error, clearError } = useResume();
  return (
    <section id="start" aria-labelledby="start-title" className="px-4 pb-24 pt-12 sm:px-6">
      <Reveal className="glass-strong relative mx-auto max-w-4xl overflow-hidden rounded-[40px] p-8 text-center sm:p-14">
        <div aria-hidden className="absolute -top-24 left-1/2 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(238_214_172/0.9),transparent)]" />
        <div className="relative">
          <h2 id="start-title" className="text-4xl font-semibold sm:text-6xl">Ready to see where you <span className="font-serif font-normal italic text-gradient-gold">stand</span>?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-mocha">Upload your resume and have your first honest analysis in about half a minute.</p>
          <div className="mx-auto mt-10 max-w-xl">
            <Dropzone busy={busy} onFile={async (f) => { if (await upload(f)) navigate("/app"); }} />
            {error && <Alert tone="error" className="mt-4 text-left" onDismiss={clearError}>{error}</Alert>}
            <Button variant="ghost" icon={Sparkles} className="mt-4" onClick={() => { loadSample(); navigate("/app"); }}>No resume handy? Try the sample</Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
