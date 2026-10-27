import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

/** Hidden file input + opener, so any button can start an upload. Render `input` once. */
export function useFilePicker(onFile) {
  const ref = useRef(null);
  const input = (
    <input
      ref={ref} type="file" className="sr-only" tabIndex={-1} aria-hidden="true"
      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }}
    />
  );
  return { open: () => ref.current?.click(), input };
}

export function Dropzone({ onFile, busy, className, title = "Drop your resume here", hint = "PDF or DOCX, text-based, up to 10 MB" }) {
  const [drag, setDrag] = useState(false);
  const { open, input } = useFilePicker(onFile);
  return (
    <>
      {input}
      <button
        type="button" onClick={open} disabled={busy}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        className={cn(
          "group flex w-full flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed px-6 py-10 text-center transition-all duration-500 ease-[var(--ease-premium)]",
          drag ? "border-gold bg-champagne/25" : "border-taupe/50 bg-white/40 hover:border-gold hover:bg-white/70",
          className,
        )}
      >
        <span className="glass flex size-14 items-center justify-center rounded-2xl text-gold transition-transform duration-500 group-hover:-translate-y-1">
          {busy ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <FileUp className="size-6" aria-hidden />}
        </span>
        <span className="font-display text-lg font-semibold text-espresso">{busy ? "Reading your resume…" : title}</span>
        <span className="text-sm text-mocha">{busy ? "This only takes a moment" : <>or <span className="font-medium text-espresso underline decoration-gold/60 underline-offset-4">browse files</span> · {hint}</>}</span>
      </button>
    </>
  );
}
