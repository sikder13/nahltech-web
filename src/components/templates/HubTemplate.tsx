import { Children } from "react";

import { EmptyState } from "@/components/blocks/EmptyState";
import { PageHeader } from "@/components/blocks/PageHeader";

import type { ReactNode } from "react";

/**
 * T5 — hub template.
 *
 * Renders the header plus either the card grid or, when nothing has been
 * published to this hub yet, a single placeholder panel. `/research` and
 * `/blog` are both empty at launch and must still look intentional.
 */
export function HubTemplate({
  title,
  intro,
  emptyLabel,
  children,
}: {
  title: string;
  intro: string;
  emptyLabel: string;
  children?: ReactNode;
}) {
  const hasItems = Children.count(children) > 0;

  return (
    <>
      <PageHeader title={title} intro={intro} />
      <div className="mx-auto max-w-(--container-page) px-sm pb-2xl">
        {hasItems ? children : <EmptyState label={emptyLabel} />}
      </div>
    </>
  );
}
