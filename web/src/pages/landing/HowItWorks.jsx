import { ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Reveal } from "../../components/ui/Reveal";

const STEPS = [
  { n: "01", title: "Upload your resume", text: "Drop in a PDF or DOCX. We read the text right in your session, so scanned images need a text-based version." },
  { n: "02", title: "Choose your path", text: "Paste a job description to see exactly how you fit, or let us suggest roles from your resume and search for matches." },
  { n: "03", title: "Improve and apply", text: "Fix gaps, strengthen bullets, draft a truthful cover letter, rehearse with the coach and export a report." },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">How it works</p>
          <h2 id="how-title" className="mt-3 text-4xl font-semibold sm:text-5xl">Three steps. No guesswork.</h2>
        </Reveal>
        <ol className="relative mt-14 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 0.08} className="glass rounded-[28px] p-7">
              <span className="font-serif text-5xl italic text-gradient-gold" aria-hidden>{s.n}</span>
              <h3 className="mt-4 text-xl font-semibold"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
              <p className="mt-2 leading-relaxed text-mocha">{s.text}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-10 flex justify-center">
          <Button to="/app" size="lg" iconRight={ArrowRight}>Open the workspace</Button>
        </Reveal>
      </div>
    </section>
  );
}
