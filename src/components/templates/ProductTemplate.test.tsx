import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductTemplate } from "./ProductTemplate";

import en from "@/lib/i18n/dictionaries/en.json";
import { productLinks } from "@/lib/routes";

describe("ProductTemplate", () => {
  it("renders the hero, features and audience for a live product", () => {
    render(
      <ProductTemplate
        t={en}
        name="Crawlmouse"
        status={en.productStatus.live}
        liveUrl={productLinks.crawlmouse}
        content={en.productPages.crawlmouse}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Crawlmouse" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: en.product.featuresHeading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: en.product.audienceHeading,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).not.toHaveLength(0);
  });

  it("renders Try it live only when there is a public URL", () => {
    render(
      <ProductTemplate
        t={en}
        name="Crawlmouse"
        status={en.productStatus.live}
        liveUrl={productLinks.crawlmouse}
        content={en.productPages.crawlmouse}
      />,
    );

    const live = screen.getByRole("link", {
      name: new RegExp(en.cta.tryItLive),
    });
    expect(live).toHaveAttribute("href", "https://crawlmouse.com");
    expect(live).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits Try it live for a product with no public URL", () => {
    render(
      <ProductTemplate
        t={en}
        name="Hafsa Sastho"
        status={en.productStatus.closedBeta}
        liveUrl={productLinks.hafsaSastho}
        content={en.productPages.hafsaSastho}
      />,
    );

    // Closed beta: no destination exists, so no button rather than a dead one.
    expect(
      screen.queryByRole("link", { name: new RegExp(en.cta.tryItLive) }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(en.productStatus.closedBeta)).toBeInTheDocument();
  });
});
