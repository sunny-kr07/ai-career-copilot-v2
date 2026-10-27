import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText, PLACEHOLDER_RE } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

/** Highlights [placeholders] the user still has to fill in with real numbers. */
export function Highlighted({ text }) {
  return text.split(PLACEHOLDER_RE).map((part, i) =>
    /^\[.*\]$/.test(part) ? (
      <mark key={i} className="rounded-md bg-champagne/45 px-1.5 py-0.5 font-medium text-espresso">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function BulletFix({ original, improved, reason, needsInput }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyText(improved)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <li className="glass rounded-3xl p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mocha">Before</p>
          <p className="mt-2 leading-relaxed text-mocha">{original}</p>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">After</p>
            {needsInput && <Badge tone="gold">Needs your numbers</Badge>}
          </div>
          <p className="mt-2 leading-relaxed text-espresso"><Highlighted text={improved} /></p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/70 pt-4">
        <p className="min-w-0 flex-1 basis-64 text-sm text-mocha"><span className="font-medium text-espresso">Why:</span> {reason}</p>
        <Button variant="glass" size="sm" icon={copied ? Check : Copy} onClick={copy} aria-label="Copy improved bullet">
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </li>
  );
}
