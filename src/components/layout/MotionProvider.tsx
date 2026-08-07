"use client";

import { MotionConfig } from "framer-motion";

import type { ReactNode } from "react";

/**
 * `reducedMotion="user"` makes every Framer Motion animation respect the OS
 * setting without each component opting in. The CSS counterpart lives in
 * globals.css and covers transitions outside React's control.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
