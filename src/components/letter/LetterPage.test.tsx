import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LetterPage } from "./LetterPage";

import { allLetterPages, letterSharedCopy } from "@/lib/letter-pages/registry";

const shared = letterSharedCopy();
const bookingUrl = "https://cal.com/example/fifteen";

describe.each(allLetterPages())("the rendered $slug page", (config) => {
  function renderPage() {
    return render(
      <LetterPage config={config} shared={shared} bookingUrl={bookingUrl} />,
    );
  }

  it("renders every approved string, in the letter's order", () => {
    const { container } = renderPage();
    const text = container.textContent ?? "";

    const expected = [
      shared.topLine,
      config.title,
      config.subtitle,
      ...config.blocks.flatMap((block) => [block.heading, block.body]),
      shared.contact.heading,
      shared.contact.line,
      shared.contact.book,
      shared.contact.call.label,
      shared.contact.text.label,
      shared.contact.email.address,
      shared.contact.form.send,
      shared.closing,
      config.sources,
    ];

    let from = 0;
    for (const piece of expected) {
      const at = text.indexOf(piece, from);
      expect(at, piece).toBeGreaterThanOrEqual(from);
      from = at + piece.length;
    }
    // And nothing after the sources line: it is the last thing on the page.
    expect(text.slice(from)).toBe("");
  });

  it("has one title and a heading for each block and the contact block", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      ...config.blocks.map((block) => block.heading),
      shared.contact.heading,
    ]);
  });

  it("carries no image, icon or illustration", () => {
    const { container } = renderPage();

    expect(
      container.querySelectorAll("img, svg, picture, canvas"),
    ).toHaveLength(0);
  });

  it("links each source in the rule to its document, in a new tab", () => {
    renderPage();

    for (const source of config.blocks[1].links) {
      const anchor = screen.getByRole("link", { name: source.text });
      expect(anchor).toHaveAttribute("href", source.href);
      expect(anchor).toHaveAttribute("target", "_blank");
      expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("offers the four routes in order, each with the right address", () => {
    renderPage();

    const section = screen
      .getByRole("heading", { name: shared.contact.heading })
      .closest("section")!;
    const links = within(section).getAllByRole("link");

    expect(links.map((a) => a.textContent)).toEqual([
      "Book fifteen minutes",
      "Call or text (317) 507-4303",
      "Text Udaay",
      "udaay@nahltech.com",
    ]);
    expect(links[0]).toHaveAttribute("href", bookingUrl);
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[1]).toHaveAttribute("href", "tel:+13175074303");
    expect(links[2]).toHaveAttribute(
      "href",
      "sms:+13175074303?&body=Read%20your%20letter.%20Call%20me%20at%20",
    );
    expect(links[3]).toHaveAttribute(
      "href",
      "mailto:udaay@nahltech.com?subject=Your%20letter",
    );
  });

  it("links nowhere else on the site", () => {
    const { container } = renderPage();

    const internal = [...container.querySelectorAll("a")].filter((a) =>
      (a.getAttribute("href") ?? "").startsWith("/"),
    );
    expect(internal).toHaveLength(0);
  });
});
