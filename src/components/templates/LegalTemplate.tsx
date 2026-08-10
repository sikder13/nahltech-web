import { PageHeader } from "@/components/blocks/PageHeader";
import { Prose } from "@/components/ui/Prose";

import type { ReactNode } from "react";

/**
 * T6 — legal pages.
 *
 * Shares T4's reading typography through `Prose`: same measure, same heading
 * rules, same blockquote treatment. A privacy policy is long-form prose and
 * should read like it.
 */
export function LegalTemplate({
  title,
  lastUpdatedLabel,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} />
      <div className="mx-auto max-w-(--container-page) px-sm pb-2xl">
        <p className="text-sm text-text-muted">
          {lastUpdatedLabel} {lastUpdated}
        </p>
        <Prose className="mt-lg">{children}</Prose>
      </div>
    </>
  );
}
