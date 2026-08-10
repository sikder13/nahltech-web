import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArticleTemplate } from "./ArticleTemplate";

import en from "@/lib/i18n/dictionaries/en.json";

const headings = [
  { id: "background", text: "[PLACEHOLDER: section one]" },
  { id: "findings", text: "[PLACEHOLDER: section two]" },
];

const related = [
  {
    title: "[PLACEHOLDER: related one]",
    excerpt: "[PLACEHOLDER: excerpt]",
    href: "/research",
    meta: "[PLACEHOLDER: meta]",
    imageLabel: "[PLACEHOLDER: image]",
  },
];

function renderArticle(overrides?: {
  headings?: typeof headings;
  related?: typeof related;
}) {
  return render(
    <ArticleTemplate
      t={en}
      title="[PLACEHOLDER: article title]"
      author="Udaay Sikder"
      date="6 August 2026"
      dateTime="2026-08-06"
      headings={overrides?.headings ?? headings}
      related={overrides?.related ?? related}
    >
      <h2 id="background">[PLACEHOLDER: section one]</h2>
      <p>[PLACEHOLDER: body paragraph]</p>
      <blockquote>[PLACEHOLDER: pull quote]</blockquote>
    </ArticleTemplate>,
  );
}

describe("ArticleTemplate", () => {
  it("renders title, byline and a machine-readable date", () => {
    const { container } = renderArticle();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "[PLACEHOLDER: article title]",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Udaay Sikder")).toBeInTheDocument();

    const time = container.querySelector("time");
    expect(time).toHaveAttribute("datetime", "2026-08-06");
  });

  it("builds a table of contents linking to each section id", () => {
    renderArticle();

    const toc = screen.getByRole("navigation", { name: en.article.tocHeading });
    const links = within(toc).getAllByRole("link");

    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "#background",
      "#findings",
    ]);
  });

  it("omits the contents rail when the article has no h2s", () => {
    renderArticle({ headings: [] });

    expect(
      screen.queryByRole("navigation", { name: en.article.tocHeading }),
    ).not.toBeInTheDocument();
  });

  it("omits related reading when there is nothing related", () => {
    renderArticle({ related: [] });

    expect(
      screen.queryByRole("heading", { name: en.article.relatedHeading }),
    ).not.toBeInTheDocument();
  });

  it("renders MDX-shaped children inside the reading column", () => {
    renderArticle();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "[PLACEHOLDER: section one]",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("[PLACEHOLDER: pull quote]")).toBeInTheDocument();
  });
});
