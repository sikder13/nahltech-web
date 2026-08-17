import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AboutTemplate,
  ContactTemplate,
  PricingTemplate,
} from "./UtilityTemplates";

import en from "@/lib/i18n/dictionaries/en.json";
import { contactDetails } from "@/lib/routes";

describe("AboutTemplate", () => {
  it("renders the story, both founders and the credentials row", () => {
    render(<AboutTemplate t={en} />);

    expect(
      screen.getByRole("heading", { level: 1, name: en.pages.about.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Udaay Sikder")).toBeInTheDocument();
    expect(screen.getByText("Co-Founder & CEO")).toBeInTheDocument();
    expect(screen.getByText("Mohieminul Khan")).toBeInTheDocument();
    expect(screen.getByText("Co-Founder & Director")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: en.about.credentialsHeading }),
    ).toBeInTheDocument();
  });

  it("runs the three prose bands in order, then the founders", () => {
    // The order is the argument: who we are, what the work looks like, what we
    // shipped, then the faces. A reordering here changes what the page says.
    const { container } = render(<AboutTemplate t={en} />);
    const headings = [...container.querySelectorAll("h2")].map((h) =>
      h.textContent?.trim(),
    );

    expect(headings.slice(0, 4)).toEqual([
      en.about.storyHeading,
      en.about.whatWeDoHeading,
      en.about.whatWeBuiltHeading,
      en.about.teamHeading,
    ]);
    expect(en.about.teamHeading).toBe("The founders");
  });

  it("publishes the approved copy verbatim", () => {
    // Hard rule 12: this copy is the founder's, and a component that
    // paraphrases or truncates it is the failure mode worth catching.
    //
    // Matched against textContent rather than getByText, because the Bengali
    // name is wrapped in its own element and so spans several text nodes —
    // which is the point of the test below this one.
    const { container } = render(<AboutTemplate t={en} />);
    const rendered = container.textContent ?? "";

    for (const paragraph of [
      ...en.about.whatWeDoParagraphs,
      ...en.about.whatWeBuiltParagraphs,
      en.about.closingLine,
    ]) {
      expect(rendered, paragraph.slice(0, 48)).toContain(paragraph);
    }
  });

  it("marks the Bengali name so it is not read as English", () => {
    // Inter is latin-only, so these glyphs fall back regardless; the lang
    // attribute is what stops a screen reader pronouncing a Bengali name with
    // English phonetics.
    const { container } = render(<AboutTemplate t={en} />);
    const bengali = container.querySelector('[lang="bn"]');

    expect(bengali).not.toBeNull();
    expect(bengali?.textContent).toBe("হাফসা স্বাস্থ্য");
    // The English around it stays in the document language.
    expect(screen.getByText(/Hafsa Sastho/)).toBeInTheDocument();
  });

  it("names Mohieminul without his middle name", () => {
    // Explicit founder instruction. The page shipped with "Mohieminul Islam
    // Khan" until the photographs landed, so this is a corrected fact rather
    // than a preference.
    render(<AboutTemplate t={en} />);
    expect(screen.queryByText(/Mohieminul Islam/)).not.toBeInTheDocument();
  });

  it("renders each founder's photograph at avatar size, with real alt text", () => {
    // This assertion used to be its opposite — the page shipped with neutral
    // glyphs and a test that no image existed, because stock photography is
    // worse than no photograph. Real photographs replace it; the ban on
    // inventing a face is what the glyph fallback still carries.
    const { container } = render(<AboutTemplate t={en} />);
    const images = [...container.querySelectorAll("img")];

    expect(images).toHaveLength(en.about.team.length);

    for (const [index, member] of en.about.team.entries()) {
      const image = images[index];
      expect(image.getAttribute("alt")).toBe(member.photoAlt);
      // Explicit dimensions reserve the box before the file lands, which is
      // what keeps a photograph out of the CLS budget.
      expect(image.getAttribute("width")).toBe("56");
      expect(image.getAttribute("height")).toBe("56");
      // Retina without a second request on ordinary screens.
      expect(image.getAttribute("srcset")).toContain("@2x.webp 2x");
      expect(image.getAttribute("src")).toMatch(/^\/images\/team\/.+\.webp$/);
    }
  });

  it("falls back to the neutral glyph for anyone without a photograph", () => {
    // The registry is the switch, so a new name on the page does not silently
    // borrow someone else's portrait.
    const withoutPhoto = {
      ...en,
      about: {
        ...en.about,
        team: [
          {
            name: "Someone New",
            role: "Engineer",
            photoAlt: "Someone New, Engineer of Nahl Technologies",
          },
        ],
      },
    };

    const { container } = render(<AboutTemplate t={withoutPhoto} />);

    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(screen.getByText("Someone New")).toBeInTheDocument();
  });
});

describe("ContactTemplate", () => {
  it("exposes the NAP with working protocol links", () => {
    render(<ContactTemplate t={en} />);

    expect(
      screen.getByRole("link", { name: en.cta.phoneDisplay }),
    ).toHaveAttribute("href", contactDetails.phoneHref);
    expect(
      screen.getByRole("link", { name: contactDetails.email }),
    ).toHaveAttribute("href", contactDetails.emailHref);
    expect(screen.getByText(/6902 Challenge Ln/)).toBeInTheDocument();
  });

  it("anchors the form section so the home hero CTA resolves", () => {
    const { container } = render(<ContactTemplate t={en} />);

    // The home page links to /contact#lead-form; that target must exist.
    expect(container.querySelector("#lead-form")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: en.leadForm.submit }),
    ).toBeInTheDocument();
  });
});

describe("PricingTemplate", () => {
  it("publishes the founding-client terms without a live counter", () => {
    render(<PricingTemplate t={en} />);

    expect(
      screen.getByRole("heading", { name: en.pricing.founding.heading }),
    ).toBeInTheDocument();
    // The count is a static dictionary value, edited by hand.
    expect(en.pricing.founding.heading).toContain(
      `${en.pricing.founding.spotsOpen} of 10`,
    );
  });

  it("renders all three tiers and the build list with real prices", () => {
    render(<PricingTemplate t={en} />);

    for (const tier of en.pricing.tiers) {
      expect(
        screen.getByRole("heading", { level: 3, name: tier.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(tier.price)).toBeInTheDocument();
    }
    for (const project of en.pricing.projects) {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    }
    // No gated token may survive on a page that now publishes numbers.
    expect(screen.queryByText("[PRICE]")).not.toBeInTheDocument();
  });

  it("lists every discount band", () => {
    render(<PricingTemplate t={en} />);

    for (const item of en.pricing.discounts.items) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    expect(
      screen.getByText(en.pricing.discounts.community),
    ).toBeInTheDocument();
  });
});
