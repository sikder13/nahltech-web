import { ButtonLink } from "@/components/ui/ButtonLink";

import type { CtaAction } from "./CtaBlock";

/**
 * Single-line call to action for use mid-article, where the full CtaBlock
 * would break the reading flow. Rendered as an aside so screen readers can
 * skip it without losing the thread of the piece.
 */
export function CtaSlim({ body, action }: { body: string; action: CtaAction }) {
  return (
    <aside className="mt-xl flex flex-col gap-sm rounded-lg border-s-4 border-accent bg-surface p-md sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text">{body}</p>
      <ButtonLink href={action.href} className="shrink-0">
        {action.label}
      </ButtonLink>
    </aside>
  );
}
