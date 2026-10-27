import { EyeOff, HardDriveDownload, ShieldCheck, Trash2 } from "lucide-react";
import { Reveal } from "../../components/ui/Reveal";

const ITEMS = [
  { icon: ShieldCheck, title: "Sent only to generate results", text: "Your resume text goes to Google’s Gemini API to produce your analysis, letter and coaching. Nothing else." },
  { icon: HardDriveDownload, title: "Nothing saved to disk", text: "Files are read in memory. There’s no database and no stored copy of your resume on the server." },
  { icon: Trash2, title: "Yours to wipe", text: "Press Clear session in the workspace, or simply close the tab, and everything is gone." },
  { icon: EyeOff, title: "Honest by design", text: "Rewrites and letters use only facts from your resume, so nothing you send is exaggerated." },
];

export function Privacy() {
  return (
    <section id="privacy" aria-labelledby="privacy-title" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="glass-strong rounded-[40px] p-8 sm:p-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Privacy</p>
            <h2 id="privacy-title" className="mt-3 text-4xl font-semibold sm:text-5xl">Your resume stays yours.</h2>
            <p className="mt-4 text-lg text-mocha">A resume is personal. Here’s exactly what happens to it.</p>
          </div>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {ITEMS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-gold shadow-inset"><Icon className="size-5" aria-hidden /></span>
                <div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 leading-relaxed text-mocha">{text}</p></div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
