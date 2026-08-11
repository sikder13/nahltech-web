import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServiceTemplate } from "./ServiceTemplate";

import { DemoCasePanel } from "@/components/blocks/demos";

import en from "@/lib/i18n/dictionaries/en.json";
import { bookingCta } from "@/lib/routes";

const content = en.servicePages.aiConsultancy;
const demoContent = content.demo;

/** The demonstration is a slot, so tests supply the same one the page does. */
const demo = (
  <DemoCasePanel
    heading={demoContent.heading}
    rows={demoContent.rows}
    closing={demoContent.closing}
  />
);

describe("ServiceTemplate", () => {
  it("renders the anatomy in order: problem, demo, method, price, deliverables, measurement, faq, cta", () => {
    const { container } = render(
      <ServiceTemplate t={en} content={content} demo={demo} />,
    );

    const h2s = Array.from(container.querySelectorAll("h2")).map(
      (node) => node.textContent,
    );

    expect(h2s).toEqual([
      en.service.problemHeading,
      // Demonstration and measurement headings are written per service, so
      // they come from the page content rather than the shared labels.
      demoContent.heading,
      en.service.methodHeading,
      en.service.priceHeading,
      en.service.deliverablesHeading,
      content.measurement.heading,
      en.service.faqHeading,
      en.ctaBlock.heading,
    ]);
  });

  it("publishes the price rather than hiding it behind an enquiry", () => {
    render(<ServiceTemplate t={en} content={content} demo={demo} />);

    expect(screen.getByText(content.price.amount)).toBeInTheDocument();
    expect(screen.getByText(content.price.unit)).toBeInTheDocument();
    expect(content.price.amount).not.toContain("PLACEHOLDER");
  });

  it("states how the work will be measured", () => {
    render(<ServiceTemplate t={en} content={content} demo={demo} />);

    expect(
      screen.getByRole("heading", { name: content.measurement.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.measurement.body)).toBeInTheDocument();
  });

  it("renders every method step and deliverable", () => {
    render(<ServiceTemplate t={en} content={content} demo={demo} />);

    for (const step of content.steps) {
      expect(
        screen.getByRole("heading", { level: 3, name: step.label }),
      ).toBeInTheDocument();
    }
    for (const item of content.deliverables) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it("renders each FAQ as a collapsed disclosure", () => {
    render(<ServiceTemplate t={en} content={content} demo={demo} />);

    for (const entry of content.faq) {
      const trigger = screen.getByRole("button", {
        name: new RegExp(
          entry.question.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ),
      });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("closes with a CTA pointing at booking", () => {
    render(<ServiceTemplate t={en} content={content} demo={demo} />);

    const ctas = screen.getAllByRole("link", { name: en.cta.bookCall });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", bookingCta.href);
      expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
