import { CheckCircle2, Lightbulb } from "lucide-react";
import { Badge } from "../ui/Badge";

export function MatchedSkill({ skill, evidence }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-white/55 p-4">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden />
      <div className="min-w-0">
        <p className="font-medium text-espresso">{skill}</p>
        <p className="mt-1 text-sm italic leading-relaxed text-mocha">“{evidence}”</p>
      </div>
    </li>
  );
}

export function MissingSkill({ skill, importance, suggestion }) {
  return (
    <li className="rounded-2xl bg-white/55 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-espresso">{skill}</p>
        <Badge tone={importance === "required" ? "clay" : "neutral"}>{importance === "required" ? "Required" : "Preferred"}</Badge>
      </div>
      <p className="mt-2 flex gap-2 text-sm leading-relaxed text-mocha">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
        {suggestion}
      </p>
    </li>
  );
}

export function KeywordChips({ keywords }) {
  if (!keywords.length) return <p className="text-sm text-mocha">No important keywords are missing.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {keywords.map((k) => (
        <li key={k} className="rounded-full bg-champagne/20 px-3.5 py-1.5 text-sm font-medium text-[#6e5226] ring-1 ring-inset ring-champagne/50">
          {k}
        </li>
      ))}
    </ul>
  );
}
