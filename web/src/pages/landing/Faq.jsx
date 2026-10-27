import { Accordion } from "../../components/ui/Accordion";
import { Reveal } from "../../components/ui/Reveal";

const ITEMS = [
  { q: "Which resume files work?", a: "Text-based PDF or DOCX files up to 10 MB. Scanned or image-only PDFs can’t be read, so export a text-based PDF or use a DOCX instead." },
  { q: "How is the match score calculated?", a: "It’s a weighted blend of four 0 to 100 scores: required skills (40%), experience level (25%), domain relevance (20%) and keywords (15%). The workspace shows every component." },
  { q: "Will it make things up on my resume?", a: "No. Rewrites and cover letters may only use facts already in your resume. Where a metric is missing you’ll see a [placeholder] to fill in with your real number." },
  { q: "Where do the jobs come from?", a: "Naukri, Indeed and LinkedIn job boards, free remote job boards, or Adzuna when it’s configured. Each result links to the original posting, and some boards rate-limit, so results can vary." },
  { q: "Are the scores a verdict?", a: "No. They’re AI estimates meant as guidance. Always read the posting and check the details yourself before applying." },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">FAQ</p>
          <h2 id="faq-title" className="mt-3 text-4xl font-semibold sm:text-5xl">Good questions.</h2>
        </Reveal>
        <Reveal className="mt-10"><Accordion items={ITEMS} /></Reveal>
      </div>
    </section>
  );
}
