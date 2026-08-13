"use client";

import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";

import type { ReactNode } from "react";

/**
 * `reducedMotion="user"` makes every Framer Motion animation respect the OS
 * setting without each component opting in. The CSS counterpart lives in
 * globals.css and covers transitions outside React's control.
 *
 * `LazyMotion` with the `domAnimation` feature set replaces the full `motion`
 * component, which bundles drag, layout projection and SVG path animation that
 * this site never uses. `domAnimation` carries animations, exit and the
 * gesture set — and `inView` lives in that gesture set, which is what `FadeIn`
 * needs for `whileInView`.
 *
 * `strict` is the guard rail: with it, any `motion.*` usage throws instead of
 * quietly pulling the full bundle back in and undoing this. Use `m.*`.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
