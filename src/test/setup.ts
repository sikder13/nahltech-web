import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * jsdom has no IntersectionObserver, and Framer Motion's `whileInView` — used
 * by the FadeIn wrapper on every animated section — needs one. This stub
 * reports every observed element as immediately in view, which is the state
 * we want assertions to run against: content revealed, not mid-animation.
 */
if (!("IntersectionObserver" in globalThis)) {
  class StubIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];

    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element): void {
      const rect = target.getBoundingClientRect();
      this.callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target,
            boundingClientRect: rect,
            intersectionRect: rect,
            rootBounds: null,
            time: 0,
          },
        ] as IntersectionObserverEntry[],
        this as unknown as IntersectionObserver,
      );
    }

    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver =
    StubIntersectionObserver as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
});
