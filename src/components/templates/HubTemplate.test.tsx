import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HubTemplate } from "./HubTemplate";

import { CardGrid, ServiceCard } from "@/components/blocks/cards";

const fixture = {
  title: "[PLACEHOLDER: hub title]",
  intro: "[PLACEHOLDER: hub intro]",
  emptyLabel: "[PLACEHOLDER: nothing published yet]",
};

describe("HubTemplate", () => {
  it("renders the header and the card grid when it has children", () => {
    render(
      <HubTemplate {...fixture}>
        <CardGrid>
          <ServiceCard
            title="Local SEO"
            description="[PLACEHOLDER: summary]"
            href="/services/local-seo"
            icon="search"
          />
        </CardGrid>
      </HubTemplate>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: fixture.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(fixture.intro)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Local SEO" })).toHaveAttribute(
      "href",
      "/services/local-seo",
    );
    expect(screen.queryByText(fixture.emptyLabel)).not.toBeInTheDocument();
  });

  it("falls back to the empty state instead of an empty grid", () => {
    render(<HubTemplate {...fixture} />);

    expect(screen.getByText(fixture.emptyLabel)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    // The header still renders, so the page is never a dead end.
    expect(
      screen.getByRole("heading", { level: 1, name: fixture.title }),
    ).toBeInTheDocument();
  });
});
