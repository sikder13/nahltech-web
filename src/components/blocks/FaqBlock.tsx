"use client";

import { useId, useState } from "react";

import { FadeIn } from "@/components/ui/FadeIn";

export type FaqItem = { question: string; answer: string };

/**
 * Accessible FAQ accordion.
 *
 * Each entry is a real h3 wrapping a button, so the questions appear in the
 * document outline and screen-reader heading navigation works. The answer is
 * a region labelled by its button. Items open independently — nothing closes
 * an answer the reader did not ask to close.
 *
 * The button is a native <button>, so Enter and Space come for free; there is
 * no custom key handling to get wrong.
 */
export function FaqBlock({
  heading,
  items,
}: {
  heading: string;
  items: readonly FaqItem[];
}) {
  const baseId = useId();
  const [openItems, setOpenItems] = useState<ReadonlySet<number>>(new Set());

  function toggle(index: number) {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="mx-auto max-w-(--container-page) px-sm py-2xl"
    >
      <FadeIn>
        <h2 id={`${baseId}-heading`} className="text-section text-text">
          {heading}
        </h2>
        <span className="mt-xs heading-rule" aria-hidden="true" />

        <div className="mt-lg max-w-prose divide-y divide-divider border-y border-divider">
          {items.map((item, index) => {
            const isOpen = openItems.has(index);
            const buttonId = `${baseId}-q-${index}`;
            const panelId = `${baseId}-a-${index}`;

            return (
              <div key={item.question}>
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                    className="flex w-full items-start justify-between gap-sm py-md text-start text-base font-semibold text-text"
                  >
                    {item.question}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className={`mt-1 size-4 shrink-0 transition-transform motion-reduce:transition-none ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                    >
                      <path d="M5 7l5 6 5-6z" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="pb-md text-text-muted"
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </FadeIn>
    </section>
  );
}
