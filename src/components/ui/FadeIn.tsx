"use client";

import { motion } from "framer-motion";

import type { ReactNode } from "react";

/**
 * Entrance animation: a short fade with a small upward translate.
 *
 * Transform and opacity only — neither affects layout, so this cannot move
 * anything after paint and contributes nothing to CLS.
 *
 * Motion preference is handled globally by `MotionConfig reducedMotion="user"`
 * in the layout, which reduces the translate to nothing and leaves the fade.
 *
 * The `data-fade` attribute is the no-JS escape hatch: Framer Motion
 * server-renders `opacity: 0` inline, so without the `<noscript>` override in
 * the locale layout every animated section would stay invisible for anyone
 * with scripting disabled.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      data-fade=""
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
