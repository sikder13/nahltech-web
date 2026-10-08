import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LetterActionBar } from "./LetterActionBar";
import { LetterPage } from "./LetterPage";

import { allLetterPages, letterSharedCopy } from "@/lib/letter-pages/registry";
import { letterSectionKeys } from "@/lib/letter-pages/schema";

// The slider's stylesheet is drawn by the build, not by the test runner.
vi.mock("@/components/dashboard/v2/RangeSlider.module.css", () => ({
  default: {},
}));

const shared = letterSharedCopy();
const bookingUrl = "https://cal.com/example/fifteen";

/** Evidence labels the relay places on each page, counted by hand from it. */
const expectedLabels: Record<
  string,
  { ASSUMED: number; OBSERVED: number; BENCHMARK: number }
> = {
  // Benchmark: three rule figures, two sourced reasons, the context line.
  quinton: { ASSUMED: 4, OBSERVED: 1, BENCHMARK: 6 },
  // Benchmark: three rule figures, one sourced reason, hires, the context line.
  arrow: { ASSUMED: 3, OBSERVED: 2, BENCHMARK: 6 },
  // Benchmark: three rule figures, one sourced reason, the context line.
  dayafterday: { ASSUMED: 3, OBSERVED: 0, BENCHMARK: 5 },
  // Benchmark: two rule figures, two sourced reasons, the context line.
  integritycare: { ASSUMED: 3, OBSERVED: 0, BENCHMARK: 5 },
};

describe.each(allLetterPages())("the rendered $slug page", (config) => {
  function renderPage() {
    return render(
      <LetterPage config={config} shared={shared} bookingUrl={bookingUrl} />,
    );
  }

  it("opens with the top line, the title, the subtitle and the three chips", () => {
    renderPage();

    expect(
      screen.getByText(
        `Nahl Technologies Inc. · Indianapolis · Prepared for ${config.company.name}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      config.title,
    );
    expect(screen.getByText(config.subtitle)).toBeInTheDocument();
    for (const chip of shared.chips) {
      expect(screen.getByText(chip)).toBeInTheDocument();
    }
  });

  it("has the ten sections in order, each numbered", () => {
    const { container } = renderPage();

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(letterSectionKeys.map((key) => shared.sections[key].name));

    const numbers = [...container.querySelectorAll("section > p.caption")].map(
      (p) => p.textContent,
    );
    expect(numbers).toEqual([
      "01 · Where it goes wrong today",
      "02",
      "03 · What the state does when it fails",
      "04 · The software",
      "05",
      "06",
      "07",
      "08 · How the pilot runs",
      "09 · Two people, both in Indianapolis",
      "10",
    ]);
  });

  it("lists the same ten sections in the index, each linked to its section", () => {
    const { container } = renderPage();

    const index = screen.getByRole("navigation");
    const links = within(index).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(
      letterSectionKeys.map(
        (key, i) =>
          `${String(i + 1).padStart(2, "0")}${shared.sections[key].name}`,
      ),
    );
    // Hard rule 7: every fragment resolves to a real element.
    for (const a of links) {
      const id = a.getAttribute("href")!.slice(1);
      expect(container.querySelector(`section[id="${id}"]`), id).not.toBeNull();
    }
  });

  it("renders every verbatim block of the letter", () => {
    const { container } = renderPage();
    const text = container.textContent ?? "";

    for (const body of [
      config.handoff.body,
      config.whyNow.body,
      config.rule.body,
      config.build.body,
      config.build.neverTouches,
      config.thirtyDays.body,
      shared.example.disclaimer,
      shared.team.line,
      shared.contact.line,
      shared.closing,
      config.sources,
    ]) {
      expect(text, body).toContain(body);
    }
    // The sources line is the last thing in the document.
    expect(
      container.querySelector("main")?.textContent?.endsWith(config.sources),
    ).toBe(true);
  });

  it("carries each evidence label where the proposal places it", () => {
    const { container } = renderPage();

    const count = (label: string) =>
      [...container.querySelectorAll("span")].filter(
        (span) => span.textContent === label && span.children.length === 0,
      ).length;

    expect({
      ASSUMED: count("ASSUMED"),
      OBSERVED: count("OBSERVED"),
      BENCHMARK: count("BENCHMARK"),
    }).toEqual(expectedLabels[config.slug]);
  });

  it("gives each public figure in the rule a card with its source", () => {
    renderPage();

    const rule = screen
      .getByRole("heading", { name: shared.sections.rule.name })
      .closest("section")!;
    const cards = within(rule).getAllByRole("listitem");
    expect(cards).toHaveLength(config.rule.figures.length);
    config.rule.figures.forEach((figure, index) => {
      const card = within(cards[index]);
      expect(card.getAllByText(figure.figure)[0]).toBeInTheDocument();
      expect(card.getByText("BENCHMARK")).toBeInTheDocument();
      expect(card.getByText(figure.line)).toBeInTheDocument();
      const href = config.rule.links.find(
        (l) => l.text === figure.source,
      )!.href;
      expect(card.getByRole("link", { name: figure.source })).toHaveAttribute(
        "href",
        href,
      );
    });
  });

  it("links every source to its document, in a new tab", () => {
    renderPage();

    const expected = [
      ...config.rule.links.map((source) => source.href),
      ...config.whyItWorks.flatMap((item) => (item.href ? [item.href] : [])),
    ];
    for (const href of expected) {
      const anchors = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href") === href);
      expect(anchors.length, href).toBeGreaterThan(0);
      for (const anchor of anchors) {
        expect(anchor).toHaveAttribute("target", "_blank");
        expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
      }
    }
  });

  it("draws both diagrams with a text equivalent that names the failure point", () => {
    const { container } = renderPage();

    for (const diagram of [config.handoff.diagram, config.build.diagram]) {
      const figure = screen.getByText(diagram.title).closest("figure")!;
      // Two drawings, phone and desktop, both hidden from assistive tech.
      const drawings = figure.querySelectorAll("svg");
      expect(drawings).toHaveLength(2);
      for (const svg of drawings) {
        expect(svg).toHaveAttribute("aria-hidden", "true");
        expect(svg.querySelectorAll("g[data-step]")).toHaveLength(
          diagram.steps.length,
        );
      }
      // The words, in order, for anyone who cannot see the drawing.
      const steps = within(figure).getAllByRole("listitem");
      expect(steps.map((li) => li.textContent)).toEqual(
        diagram.steps.map((step) =>
          step.fail ? `${step.label} (Failure point)` : step.label,
        ),
      );
    }
    expect(config.handoff.diagram.steps.filter((s) => s.fail)).toHaveLength(1);
    expect(config.build.diagram.steps.filter((s) => s.fail)).toHaveLength(0);
    // No image, picture or canvas stands in for a drawing or a photograph.
    expect(
      container.querySelectorAll("main section img, picture, canvas"),
    ).toHaveLength(0);
  });

  it("shows the worked example opened on the proposal's own bands", () => {
    renderPage();

    const example = screen
      .getByRole("heading", { name: shared.sections.example.name })
      .closest("section")!;
    expect(
      within(example).getByRole("heading", { name: config.example.title }),
    ).toBeInTheDocument();
    for (const input of config.example.inputs) {
      expect(within(example).getByText(input.label)).toBeInTheDocument();
      expect(example.textContent).toContain(input.stated);
      if (input.reason) expect(example.textContent).toContain(input.reason);
    }
    // Two handles for every input: each one is a slider.
    expect(within(example).getAllByRole("slider")).toHaveLength(
      config.example.inputs.length * 2,
    );
    expect(example.textContent).toContain(config.example.context);
  });

  it("labels the illustration as made up", () => {
    renderPage();

    const morning = screen
      .getByRole("heading", { name: shared.sections.morning.name })
      .closest("section")!;
    expect(
      within(morning).getByText(
        "Illustration with made-up names. Your version uses your staff and your records.",
      ),
    ).toBeInTheDocument();
    const words = morning.textContent ?? "";
    const lines =
      config.morning.kind === "thread"
        ? [...config.morning.bubbles.map((b) => b.text), config.morning.caption]
        : config.morning.kind === "board"
          ? [
              ...config.morning.columns,
              ...config.morning.cards.map((c) => c.text),
              config.morning.footer,
            ]
          : config.morning.kind === "checklist"
            ? [
                config.morning.title,
                ...config.morning.rows.map((r) => r.text),
                config.morning.footer,
              ]
            : [
                config.morning.title,
                ...config.morning.columns,
                ...config.morning.rows.flat(),
                config.morning.footer,
              ];
    for (const line of lines) expect(words, line).toContain(line);
  });

  it("leaves every metric blank for the provider's own records", () => {
    renderPage();

    const thirty = screen
      .getByRole("heading", { name: shared.sections.thirtyDays.name })
      .closest("section")!;
    for (const metric of config.thirtyDays.metrics) {
      expect(within(thirty).getByText(metric)).toBeInTheDocument();
    }
    expect(
      within(thirty).getAllByText("Your number, from your records, week one"),
    ).toHaveLength(config.thirtyDays.metrics.length);
    expect(
      within(thirty).getAllByText("read again at day thirty"),
    ).toHaveLength(config.thirtyDays.metrics.length);
  });

  it("shows the timeline, the deliverables and the fee with its four terms", () => {
    renderPage();

    const thirty = screen
      .getByRole("heading", { name: shared.sections.thirtyDays.name })
      .closest("section")!;
    for (const step of shared.timeline) {
      expect(within(thirty).getByText(step.when)).toBeInTheDocument();
      expect(within(thirty).getByText(step.what)).toBeInTheDocument();
    }
    expect(
      within(thirty).getByRole("heading", { name: "What you receive" }),
    ).toBeInTheDocument();
    for (const item of config.thirtyDays.receive) {
      expect(within(thirty).getByText(item)).toBeInTheDocument();
    }
    expect(
      within(thirty).getByRole("heading", { name: "The fee" }),
    ).toBeInTheDocument();
    expect(within(thirty).getByText(config.thirtyDays.fee)).toBeInTheDocument();
    for (const term of shared.fee.terms) {
      expect(within(thirty).getByText(term)).toBeInTheDocument();
    }
  });

  it("names the two people, with no photograph", () => {
    renderPage();

    const team = screen
      .getByRole("heading", { name: shared.sections.team.name })
      .closest("section")!;
    for (const person of shared.team.people) {
      expect(
        within(team).getByRole("heading", { name: person.name }),
      ).toBeInTheDocument();
      expect(within(team).getByText(person.role)).toBeInTheDocument();
      for (const line of person.lines) {
        expect(within(team).getByText(line)).toBeInTheDocument();
      }
    }
    expect(team.querySelectorAll("img")).toHaveLength(0);
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
    // Equal weight: the four share one treatment.
    expect(new Set(links.map((a) => a.className)).size).toBe(1);
    expect(within(section).getAllByRole("textbox")).toHaveLength(1);
  });

  it("links into the site only through the wordmark", () => {
    const { container } = renderPage();

    const internal = [...container.querySelectorAll("a")]
      .map((a) => a.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("/"));
    expect(internal).toEqual(["/"]);
  });
});

describe("LetterActionBar", () => {
  const props = {
    contactId: "not-on-this-page",
    book: { label: "Book fifteen minutes", href: bookingUrl },
    text: { label: "Text Udaay", href: "sms:+13175074303" },
  };

  it("offers the two quickest replies", () => {
    render(<LetterActionBar {...props} />);

    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual([
      "Book fifteen minutes",
      "Text Udaay",
    ]);
    expect(links[0]).toHaveAttribute("href", bookingUrl);
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[1]).toHaveAttribute("href", "sms:+13175074303");
  });

  it("steps aside while a field has focus, so the keyboard never hides it", () => {
    render(
      <>
        <textarea aria-label="reply" />
        <LetterActionBar {...props} />
      </>,
    );

    act(() => screen.getByRole("textbox").focus());
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    act(() => screen.getByRole("textbox").blur());
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("steps aside once the reply section is on screen", () => {
    // The test environment reports every observed element as in view.
    render(
      <>
        <section id="contact" />
        <LetterActionBar {...props} contactId="contact" />
      </>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
