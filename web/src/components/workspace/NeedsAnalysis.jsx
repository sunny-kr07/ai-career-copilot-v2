import { Target } from "lucide-react";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";

/** Empty state for pages that depend on a finished analysis. */
export function NeedsAnalysis({ resume, what }) {
  return (
    <GlassCard strong padded="lg" className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white/80 text-gold shadow-inset"><Target className="size-6" aria-hidden /></span>
      <h2 className="text-2xl font-semibold">{resume ? "Analyze a job first" : "Add your resume first"}</h2>
      <p className="max-w-md text-mocha">
        {resume ? `${what} is built from your fit analysis, so run one against a job description first.` : "Upload your resume above, then analyze it against a job description."}
      </p>
      <Button to={resume ? "/app/analyze" : "/app"}>{resume ? "Go to analysis" : "Get started"}</Button>
    </GlassCard>
  );
}
