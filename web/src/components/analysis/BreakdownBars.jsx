import { motion, useReducedMotion } from "motion/react";
import { SCORE_LABELS, TONE_HEX, scoreTone } from "../../lib/utils";

/** The four weighted score dimensions as slim animated bars. */
export function BreakdownBars({ breakdown, weights }) {
  const reduce = useReducedMotion();
  return (
    <ul className="space-y-4">
      {Object.entries(SCORE_LABELS).map(([key, label], i) => {
        const value = breakdown[key];
        return (
          <li key={key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-espresso">
                {label} <span className="font-normal text-mocha">· {weights[key]}% weight</span>
              </span>
              <span className="font-medium tabular-nums text-espresso">{value}</span>
            </div>
            <div className="field h-2.5 overflow-hidden rounded-full" role="presentation">
              <motion.div
                className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TONE_HEX.gold}, ${TONE_HEX[scoreTone(value)]})` }}
                initial={{ width: reduce ? `${value}%` : 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }}
                transition={{ duration: 1.1, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
