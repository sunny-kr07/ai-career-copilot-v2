import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Lock, Sparkles, Upload } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useFilePicker } from "../../components/ui/Dropzone";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { BreakdownBars } from "../../components/analysis/BreakdownBars";
import { useResume } from "../../lib/useResume";

const SAMPLE_BREAKDOWN = { required_skills: 78, experience_level: 90, domain_relevance: 84, keywords: 70 };
const WEIGHTS = { required_skills: 40, experience_level: 25, domain_relevance: 20, keywords: 15 };

function Orb({ className, style }) {
  return (
    <motion.div
      aria-hidden style={style}
      className={`absolute rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff_0%,#f6dcc2_32%,#d9a77f_100%)] shadow-[inset_-8px_-10px_24px_rgb(150_100_60/0.35),0_30px_50px_-20px_rgb(107_90_73/0.5)] ${className}`}
    />
  );
}

/** Illustrative product preview. Static sample data, marked as an image for assistive tech. */
function ProductPreview() {
  return (
    <div
      role="img"
      aria-label="Illustration of an analysis: 81 out of 100, a strong match for a Backend Engineer role, with Kubernetes flagged as a required gap."
      className="glass-strong rounded-[36px] p-3 sm:p-4"
    >
      <div aria-hidden className="rounded-[28px] bg-gradient-to-b from-white/70 to-cream/60 p-5 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {["#e6cdb0", "#dcc3a4", "#d2b896"].map((c) => <span key={c} className="size-3 rounded-full" style={{ background: c }} />)}
          </div>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-mocha">Backend Engineer · sample analysis</span>
          <span className="w-10" />
        </div>
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <ScoreRing score={81} size={168} />
            <Badge tone="sage">Strong match</Badge>
          </div>
          <div className="min-w-0 text-left">
            <BreakdownBars breakdown={SAMPLE_BREAKDOWN} weights={WEIGHTS} />
          </div>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white/65 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mocha">Skills found</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Python", "REST APIs", "PostgreSQL", "Docker"].map((s) => (
                <span key={s} className="rounded-full bg-sage/10 px-3 py-1 text-sm font-medium text-sage ring-1 ring-inset ring-sage/25">{s}</span>
              ))}
              <span className="rounded-full bg-clay/10 px-3 py-1 text-sm font-medium text-clay ring-1 ring-inset ring-clay/25">Kubernetes · required gap</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/65 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Sharper bullet</p>
            <p className="mt-3 text-sm leading-relaxed text-espresso">
              Built REST APIs in Python and Flask serving 50k users, <mark className="rounded bg-champagne/45 px-1 text-espresso">[add latency or uptime result]</mark>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const stage = useRef(null);
  const { upload, loadSample, busy, error, clearError } = useResume();
  const { open, input } = useFilePicker(async (file) => { if (await upload(file)) navigate("/app"); });

  const { scrollYProgress } = useScroll({ target: stage, offset: ["start end", "start 25%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.9, 1]);
  const orbA = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 60, 0]);
  const orbB = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -50, 0]);

  const trySample = () => { loadSample(); navigate("/app"); };

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden px-4 pb-24 pt-36 sm:px-6 sm:pt-44">
      {input}
      {/* luminous arc, echoing the warm light curve in the moodboard */}
      <svg aria-hidden className="absolute inset-x-0 bottom-0 h-[420px] w-full opacity-90" viewBox="0 0 1440 420" preserveAspectRatio="none">
        <defs>
          <linearGradient id="arc" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff8ec" stopOpacity="1" />
            <stop offset="1" stopColor="#e9cfa2" stopOpacity="0.2" />
          </linearGradient>
          <filter id="arc-blur"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <path d="M-20 140 C 360 380, 820 420, 1460 40" fill="none" stroke="url(#arc)" strokeWidth="10" filter="url(#arc-blur)" />
        <path d="M-20 140 C 360 380, 820 420, 1460 40" fill="none" stroke="url(#arc)" strokeWidth="2" />
      </svg>

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <Badge tone="gold" icon={Sparkles}>Resume intelligence, built on honesty</Badge>
        </motion.div>
        <motion.h1
          id="hero-title"
          initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 text-[44px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-7xl lg:text-[88px]"
        >
          Know your <span className="font-serif font-normal italic text-gradient-gold">fit</span>
          <br className="hidden sm:block" /> before you apply.
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-mocha sm:text-xl"
        >
          Upload your resume for an honest match score, the skills you’re missing, sharper bullets and a cover letter that never invents a fact. Or let it find the roles you actually fit.
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" icon={Upload} loading={busy} onClick={open} className="w-full sm:w-auto">Upload your resume</Button>
          <Button size="lg" variant="glass" iconRight={ArrowRight} onClick={trySample} className="w-full sm:w-auto">Try with a sample</Button>
        </motion.div>
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-mocha">
          <Lock className="size-3.5" aria-hidden /> PDF or DOCX · up to 10 MB · cleared when you close the tab
        </p>
        {error && <Alert tone="error" className="mx-auto mt-5 max-w-md text-left" onDismiss={clearError}>{error}</Alert>}
      </div>

      <div ref={stage} className="relative mx-auto mt-16 max-w-4xl [perspective:1800px] sm:mt-20">
        <Orb className="-left-10 top-10 hidden size-28 animate-float sm:block lg:-left-24 lg:size-36" style={{ y: orbA }} />
        <Orb className="-right-6 bottom-10 hidden size-20 animate-float [animation-delay:-4s] sm:block lg:-right-20 lg:size-28" style={{ y: orbB }} />
        <motion.div style={{ rotateX, scale, transformOrigin: "50% 0%" }} className="relative will-change-transform">
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
