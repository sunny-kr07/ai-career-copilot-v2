import { motion, useReducedMotion } from "motion/react";

/** Restrained scroll-triggered reveal. Plays once, and is skipped for reduced-motion users. */
export function Reveal({ as = "div", delay = 0, y = 22, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] ?? motion.div;
  if (reduce) return <Tag className={className} {...rest}>{children}</Tag>;
  return (
    <Tag
      className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }} {...rest}
    >
      {children}
    </Tag>
  );
}
