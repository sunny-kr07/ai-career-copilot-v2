import { FileText, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { setState, useSession } from "../../lib/store";
import { useResume } from "../../lib/useResume";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { useFilePicker } from "../ui/Dropzone";

/** Always-visible resume status for the workspace: upload, replace, remove or load demo data. */
export function ResumeBar() {
  const resume = useSession((s) => s.resume);
  const { upload, loadSample, busy, error, clearError } = useResume();
  const { open, input } = useFilePicker(upload);

  return (
    <section aria-label="Your resume" className="mb-8">
      {input}
      <div className="glass flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl p-3.5 pr-4 sm:p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-gold shadow-inset">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 basis-48">
          {resume ? (
            <>
              <p className="truncate font-medium text-espresso">{resume.name}</p>
              <p className="text-sm text-mocha">
                {resume.words.toLocaleString()} words · {resume.source === "sample" ? "Demo data, entirely fictional" : "Read from your file"}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-espresso">Add your resume to begin</p>
              <p className="text-sm text-mocha">PDF or DOCX, text-based, up to 10 MB</p>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {resume ? (
            <>
              <Button variant="glass" size="sm" icon={RefreshCw} loading={busy} onClick={open}>Replace</Button>
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setState({ resume: null })} aria-label="Remove resume">Remove</Button>
            </>
          ) : (
            <>
              <Button size="sm" icon={Upload} loading={busy} onClick={open}>Upload resume</Button>
              <Button variant="glass" size="sm" icon={Sparkles} onClick={loadSample}>Try sample data</Button>
            </>
          )}
        </div>
      </div>
      {error && <Alert tone="error" className="mt-3" onDismiss={clearError}>{error}</Alert>}
    </section>
  );
}
