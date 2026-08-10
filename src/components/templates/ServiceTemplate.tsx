import { CtaBlock } from "@/components/blocks/CtaBlock";
import { FaqBlock } from "@/components/blocks/FaqBlock";
import { PageHeader } from "@/components/blocks/PageHeader";
import {
  DeliverablesList,
  DemoBlock,
  MeasurementBlock,
  MethodSteps,
  PriceCard,
  ProblemStatement,
} from "@/components/blocks/service-blocks";
import { contactDetails, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

export type ServiceContent = Dictionary["servicePages"]["aiSearchVisibility"];

/**
 * T2 — service page.
 *
 * Anatomy, in order: problem, demonstration, method, price, deliverables,
 * how we measure, FAQ, CTA. The sequence is an argument — name the problem,
 * show the work, explain the method, publish the price, then say exactly how
 * the result will be checked.
 */
export function ServiceTemplate({
  t,
  content,
}: {
  t: Dictionary;
  content: ServiceContent;
}) {
  return (
    <>
      <PageHeader title={content.headline} />

      <ProblemStatement
        heading={t.service.problemHeading}
        body={content.problem}
      />

      <DemoBlock heading={content.demo.heading} body={content.demo.body} />

      <MethodSteps heading={t.service.methodHeading} steps={content.steps} />

      <PriceCard
        heading={t.service.priceHeading}
        startingAtLabel={content.price.startingAt || undefined}
        amount={content.price.amount}
        unit={content.price.unit}
        note={content.price.note}
        action={{ label: t.cta.bookCall, href: routes.contact }}
      />

      <DeliverablesList
        heading={t.service.deliverablesHeading}
        items={content.deliverables}
      />

      <MeasurementBlock
        heading={content.measurement.heading}
        body={content.measurement.body}
      />

      <FaqBlock heading={t.service.faqHeading} items={content.faq} />

      <CtaBlock
        heading={t.ctaBlock.heading}
        body={t.ctaBlock.body}
        primary={{ label: t.cta.bookCall, href: routes.contact }}
        phone={{ label: t.cta.phoneDisplay, href: contactDetails.phoneHref }}
        orCallLabel={t.cta.orCall}
      />
    </>
  );
}
