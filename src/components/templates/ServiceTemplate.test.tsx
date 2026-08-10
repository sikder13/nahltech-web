import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServiceTemplate } from "./ServiceTemplate";

import en from "@/lib/i18n/dictionaries/en.json";
import { routes } from "@/lib/routes";

const content = en.servicePages.localSeo;

describe("ServiceTemplate", () => {
  it("renders the anatomy in order: problem, demo, method, price, deliverables, measurement, faq, cta", () => {
    const { container } = render(
      <ServiceTemplate t={en} title="Local SEO" content={content} />,
    );

    const h2s = Array.from(container.querySelectorAll("h2")).map(
      (node) => node.textContent,
    );

    expect(h2s).toEqual([
      en.service.problemHeading,
      en.service.demoHeading,
      en.service.methodHeading,
      en.service.priceHeading,
      en.service.deliverablesHeading,
      en.service.measurementHeading,
      en.service.faqHeading,
      en.ctaBlock.heading,
    ]);
  });

  it("shows the published price rather than hiding it behind an enquiry", () => {
    render(<ServiceTemplate t={en} title="Local SEO" content={content} />);

    expect(screen.getByText(content.price.amount)).toBeInTheDocument();
    expect(screen.getByText(en.service.startingAt)).toBeInTheDocument();
  });

  it("pairs every measured metric with the method used to obtain it", () => {
    render(<ServiceTemplate t={en} title="Local SEO" content={content} />);

    const table = screen.getByRole("table", {
      name: en.service.measurementHeading,
    });
    const rows = within(table).getAllByRole("row");

    // One header row plus one row per metric, each with a method beside it.
    expect(rows).toHaveLength(content.measurement.length + 1);
    for (const row of content.measurement) {
      expect(screen.getByText(row.metric)).toBeInTheDocument();
      expect(screen.getByText(row.method)).toBeInTheDocument();
    }
  });

  it("closes with a CTA pointing at contact", () => {
    render(<ServiceTemplate t={en} title="Local SEO" content={content} />);

    const ctas = screen.getAllByRole("link", { name: en.cta.bookCall });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", routes.contact);
    }
  });
});
