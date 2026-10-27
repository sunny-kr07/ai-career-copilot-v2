import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { TONE_HEX, scoreTone } from "../../lib/utils";

const R = 52;
const C = 2 * Math.PI * R;
const EASE = [0.22, 1, 0.36, 1];

export function ScoreRing({ score, size = 176, caption }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? score : 0);
  const color = TONE_HEX[scoreTone(score)];
  const offset = C * (1 - score / 100);

  useEffect(() => {
    if (reduce) { setShown(score); return; }
    const controls = animate(0, score, { duration: 1.4, ease: EASE, onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [score, reduce]);

  return (
    <div
      className="relative shrink-0" style={{ width: size, height: size }} role="img"
      aria-label={`Match score ${score} out of 100${caption ? `, ${caption}` : ""}`}
    >
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgb(163 143 122 / 0.2)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={C}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
          initial={{ strokeDashoffset: reduce ? offset : C }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduce ? 0 : 1.4, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-semibold tabular-nums tracking-tight text-espresso" style={{ fontSize: size * 0.28 }}>
          {shown}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-mocha">out of 100</span>
      </div>
    </div>
  );
}
