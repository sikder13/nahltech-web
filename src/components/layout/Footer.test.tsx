import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

import en from "@/lib/i18n/dictionaries/en.json";
import { socialLinks } from "@/lib/routes";

describe("Footer social links", () => {
  it("renders one link per company profile, with the exact href", () => {
    render(<Footer t={en} />);

    const list = screen.getByRole("list", { name: en.footer.socialHeading });
    const links = within(list).getAllByRole("link");

    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://x.com/nahltech",
      "https://www.linkedin.com/company/nahl-technologies-incorporation-linkedin/",
      "https://www.facebook.com/profile.php?id=61589050512455",
    ]);
  });

  it("carries no logged-in view parameter on the LinkedIn URL", () => {
    // ?viewAsMember=true is an artefact of viewing your own page while signed
    // in. It is not part of the public address and must not ship in one.
    render(<Footer t={en} />);

    const linkedin = screen.getByRole("link", {
      name: en.footer.social.linkedin,
    });
    expect(linkedin.getAttribute("href")).not.toContain("viewAsMember");
  });

  it("hardens every outbound link", () => {
    render(<Footer t={en} />);

    const list = screen.getByRole("list", { name: en.footer.socialHeading });
    for (const link of within(list).getAllByRole("link")) {
      expect(link, link.getAttribute("href") ?? "").toHaveAttribute(
        "target",
        "_blank",
      );
      // noreferrer as well as noopener: without it the destination is told
      // which page sent the visitor.
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("gives each icon-only link an accessible name that says which network", () => {
    // The mark carries no text, so aria-label is the whole accessible name.
    // "Social link" three times over would be useless in a link list.
    render(<Footer t={en} />);

    for (const link of socialLinks) {
      expect(
        screen.getByRole("link", { name: en.footer.social[link.key] }),
        link.key,
      ).toHaveAttribute("href", link.href);
    }
  });

  it("hides the decorative marks from assistive tech", () => {
    const { container } = render(<Footer t={en} />);

    const list = container.querySelector(
      `ul[aria-label="${en.footer.socialHeading}"]`,
    );
    const svgs = list?.querySelectorAll("svg") ?? [];
    expect(svgs).toHaveLength(3);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("still renders the NAP block alongside them", () => {
    // The social row was inserted into the same column; this catches a layout
    // edit that drops the address it sits under.
    render(<Footer t={en} />);

    expect(screen.getByText(en.footer.street)).toBeInTheDocument();
    expect(screen.getByText(en.footer.cityRegionPostal)).toBeInTheDocument();
  });
});
