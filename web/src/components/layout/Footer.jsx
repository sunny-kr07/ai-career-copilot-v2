import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const columns = [
  { title: "Product", links: [["#features", "Features"], ["#how", "How it works"], ["#product", "Preview"]] },
  { title: "Workspace", links: [["/app/analyze", "Analyze a job"], ["/app/jobs", "Discover jobs"], ["/app/letter", "Cover letter"], ["/app/coach", "Career copilot"]] },
  { title: "Trust", links: [["#privacy", "Privacy"], ["#faq", "FAQ"]] },
];

export function Footer() {
  return (
    <footer className="px-4 pb-10 pt-6 sm:px-6">
      <div className="glass mx-auto max-w-6xl rounded-[32px] p-8 sm:p-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mocha">
              An honest second opinion on your resume: analyze, improve, apply and prepare, without invented facts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-mocha">{c.title}</h2>
                <ul className="mt-4 space-y-3">
                  {c.links.map(([to, label]) => (
                    <li key={to}>
                      {to.startsWith("#") ? (
                        <a href={to} className="text-sm text-espresso transition-colors hover:text-gold">{label}</a>
                      ) : (
                        <Link to={to} className="text-sm text-espresso transition-colors hover:text-gold">{label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/70 pt-6 text-xs text-mocha sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} AI Career Copilot</p>
          <p>Scores are AI estimates: use them as guidance, not a verdict.</p>
        </div>
      </div>
    </footer>
  );
}
