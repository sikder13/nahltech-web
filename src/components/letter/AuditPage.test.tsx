import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditBar } from "./AuditNav";
import { AuditPage } from "./AuditPage";

import { auditSectionKeys } from "@/lib/letter-pages/audit-schema";
import {
  allAuditPages,
  auditBoardHtml,
  letterSharedCopy,
} from "@/lib/letter-pages/registry";
import { sheetById } from "@/lib/sheets";

const shared = letterSharedCopy();
const bookingUrl = "https://cal.com/example/fifteen";

/** What each page was told it must never say. */
const ruledOut: Record<string, readonly string[]> = {
  integritycare: ["$7,500", "$450", "guarantee", "monthly support", "a month"],
  quinton: [
    "$4,150",
    "$9,500",
    "$450",
    "guarantee",
    "monthly support",
    "a month",
  ],
};

describe.each(allAuditPages())("the rendered $slug audit page", (config) => {
  const sheets = config.sheets.cards.map((card) => sheetById(card.sheet)!);
  const boardHtml = auditBoardHtml(config.slug);

  function renderPage() {
    return render(
      <AuditPage
        config={config}
        shared={shared}
        sheets={sheets}
        boardHtml={boardHtml}
        bookingUrl={bookingUrl}
      />,
    );
  }

  const sectionOf = (id: string, container: HTMLElement) =>
    container.querySelector<HTMLElement>(`section[id="${id}"]`)!;

  it("opens with the eyebrow, the title, the lead and the quiet line", () => {
    renderPage();

    expect(screen.getByText(config.eyebrow)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      config.hero.title,
    );
    expect(screen.getByText(config.hero.lead)).toBeInTheDocument();
    expect(screen.getByText(config.hero.quiet)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: config.hero.sheetsButton }),
    ).toHaveAttribute("href", "#sheets");
  });

  it("has the eight sections in order, each numbered under its eyebrow", () => {
    const { container } = renderPage();

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      config.sheets.title,
      config.changed.title,
      config.preview.title,
      config.money.title,
      config.proof.title,
      config.audit.title,
      config.questions.title,
      // The reply block's heading carries its full stop.
      "Tell me where this is wrong.",
    ]);
    expect(
      [...container.querySelectorAll("section > p.caption")].map(
        (p) => p.textContent,
      ),
    ).toEqual([
      "01 · The gifts",
      "02 · Why now",
      "03 · The preview",
      "04 · What the audit would size",
      "05 · Proof",
      "06 · The roadmap and the price",
      "07 · Honest answers",
      "08 · Reply",
    ]);
  });

  it("lists the same eight sections in the index, each linked to its section", () => {
    const { container } = renderPage();

    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links).toHaveLength(8);
    links.forEach((a, i) => {
      const id = a.getAttribute("href")!.slice(1);
      expect(id).toBe(auditSectionKeys[i]);
      // Hard rule 7: every fragment resolves to a real element.
      expect(sectionOf(id, container), id).not.toBeNull();
    });
  });

  it("has one primary action, three times: hero, under the price, and the reply block", () => {
    const { container } = renderPage();

    const primary = [
      ...container.querySelectorAll<HTMLAnchorElement>("[data-primary-action]"),
    ];
    expect(primary).toHaveLength(3);
    for (const a of primary) {
      expect(a).toHaveTextContent("Book fifteen minutes");
      expect(a).toHaveAttribute("href", bookingUrl);
      expect(a).toHaveAttribute("target", "_blank");
    }
    expect(primary[0].closest("header")).not.toBeNull();
    expect(primary[1].closest("section")).toHaveAttribute("id", "audit");
    expect(primary[2].closest("section")).toHaveAttribute("id", "reply");
    // Nothing else on the page is drawn as a primary button.
    const solid = [...container.querySelectorAll("main a, main button")].filter(
      (el) => el.className.includes("bg-cta"),
    );
    expect(solid).toHaveLength(3);
  });

  it("says, under the price, that no one will chase the reader", () => {
    const { container } = renderPage();

    expect(
      within(sectionOf("audit", container)).getByText(
        "No forms before the call. No one will call you because you visited this page.",
      ),
    ).toBeInTheDocument();
  });

  it("offers both sheets as direct downloads of the registry's files", () => {
    const { container } = renderPage();

    const section = sectionOf("sheets", container);
    const downloads = within(section)
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.endsWith(".pdf"));
    expect(downloads.map((a) => a.getAttribute("href"))).toEqual(
      sheets.map((sheet) => sheet.file),
    );
    for (const card of config.sheets.cards) {
      expect(
        within(section).getByRole("heading", { name: card.title }),
      ).toBeInTheDocument();
      expect(within(section).getByText(card.line)).toBeInTheDocument();
    }
    expect(within(section).getAllByText(config.sheets.meta)).toHaveLength(2);
    // The permanent address is printed as written, and is a link to itself.
    expect(section.textContent).toContain(config.sheets.always);
    expect(
      within(section).getByRole("link", { name: config.sheets.address }),
    ).toHaveAttribute("href", `/${config.slug}/sheets`);
  });

  it("sources each change and each proof card, in a new tab where it has an address", () => {
    const { container } = renderPage();

    for (const item of [...config.changed.cards, ...config.proof.cards]) {
      expect(screen.getByText(item.line)).toBeInTheDocument();
      if (!item.href) {
        // Named, not linked: there is no address to send the reader to.
        expect(screen.getByText(item.source).closest("a")).toBeNull();
        continue;
      }
      const anchor = screen.getByRole("link", { name: item.source });
      expect(anchor).toHaveAttribute("href", item.href);
      expect(anchor).toHaveAttribute("target", "_blank");
      expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
    }
    if (config.changed.bodyLink) {
      expect(
        screen.getByRole("link", { name: config.changed.bodyLink.text }),
      ).toHaveAttribute("href", config.changed.bodyLink.href);
    }
    for (const item of config.changed.cards) {
      expect(screen.getByText(item.figure)).toBeInTheDocument();
    }
    // A public figure carries its label: one per change, one per proof.
    const labels = [...container.querySelectorAll("span")].filter(
      (span) => span.textContent === "BENCHMARK" && span.children.length === 0,
    );
    expect(labels).toHaveLength(
      config.changed.cards.length + config.proof.cards.length,
    );
    expect(container.textContent).toContain(config.changed.body);
    expect(container.textContent).toContain(config.proof.after);
  });

  it("embeds the prototype by text, lazily, and links the full preview", () => {
    const { container } = renderPage();

    const section = sectionOf("preview", container);
    expect(section.textContent).toContain(config.preview.lead);
    const frame = section.querySelector("iframe")!;
    expect(frame).toHaveAttribute("title", config.preview.frameTitle);
    expect(frame).toHaveAttribute("loading", "lazy");
    expect(frame).not.toHaveAttribute("src");
    expect(frame.getAttribute("srcdoc")).toBe(boardHtml);
    expect(
      within(section).getByRole("link", { name: config.preview.open }),
    ).toHaveAttribute("href", `/m3/${config.token}/preview`);
    for (const caption of config.preview.captions) {
      expect(within(section).getByText(caption)).toBeInTheDocument();
    }
  });

  it("keeps the arithmetic folded until asked for", () => {
    const { container } = renderPage();

    const section = sectionOf("money", container);
    const folds = [...section.querySelectorAll("details")];
    expect(folds).toHaveLength(config.money.rows.length);
    config.money.rows.forEach((row, index) => {
      expect(
        within(section).getByRole("heading", { name: row.title }),
      ).toBeInTheDocument();
      expect(within(section).getByText(row.line)).toBeInTheDocument();
      expect(folds[index]).not.toHaveAttribute("open");
      expect(folds[index].querySelector("summary")).toHaveTextContent(
        "Show the arithmetic",
      );
      expect(folds[index].textContent).toContain(row.arithmetic);
    });
    expect(section.textContent).toContain(config.money.after);
  });

  it("lays out the audit: its steps, three folded boxes, step zero and the price", () => {
    const { container } = renderPage();

    const section = sectionOf("audit", container);
    for (const step of config.audit.steps) {
      expect(within(section).getAllByText(step.label)[0]).toBeInTheDocument();
      expect(section.textContent).toContain(step.text);
    }
    expect(section.querySelectorAll("ol > li")).toHaveLength(
      config.audit.steps.length,
    );
    const boxes = [...section.querySelectorAll("details")];
    expect(boxes.map((d) => d.querySelector("summary")?.textContent)).toEqual([
      "What we need from you",
      "What you receive",
      "What the audit is likely to find",
    ]);
    boxes.forEach((box, index) => {
      expect(box).not.toHaveAttribute("open");
      expect(box.textContent).toContain(config.audit.boxes[index].text);
    });
    expect(section.textContent).toContain(config.audit.stepZero.text);
    expect(
      within(section).getByText(config.audit.price.amount),
    ).toBeInTheDocument();
    expect(
      within(section).getByText(config.audit.price.term),
    ).toBeInTheDocument();
    for (const line of config.audit.price.lines) {
      expect(within(section).getByText(line)).toBeInTheDocument();
    }
  });

  it("shows every question and folds every answer", () => {
    const { container } = renderPage();

    const section = sectionOf("questions", container);
    const folds = [...section.querySelectorAll("details")];
    expect(folds).toHaveLength(config.questions.items.length);
    config.questions.items.forEach((item, index) => {
      expect(folds[index]).not.toHaveAttribute("open");
      expect(folds[index].querySelector("summary")).toHaveTextContent(item.q);
      expect(folds[index].textContent).toContain(item.a);
    });
  });

  it("closes with the four routes, the reply box, the promise and the sources", () => {
    const { container } = renderPage();

    const section = sectionOf("reply", container);
    expect(section.textContent).toContain(config.reply.line);
    const links = within(section).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual([
      "Book fifteen minutes",
      "Call or text (317) 507-4303",
      "Text Udaay",
      "udaay@nahltech.com",
    ]);
    expect(links[1]).toHaveAttribute("href", "tel:+13175074303");
    expect(links[2]).toHaveAttribute(
      "href",
      "sms:+13175074303?&body=Read%20your%20letter.%20Call%20me%20at%20",
    );
    expect(links[3]).toHaveAttribute(
      "href",
      "mailto:udaay@nahltech.com?subject=Your%20letter",
    );
    expect(within(section).getAllByRole("textbox")).toHaveLength(1);
    expect(within(section).getByText(config.reply.closing)).toBeInTheDocument();
    expect(
      container.querySelector("main")?.textContent?.endsWith(config.sources),
    ).toBe(true);
  });

  it("says nothing that was ruled out, on the page or in the prototype", () => {
    const { container } = renderPage();

    const words = (container.textContent ?? "") + boardHtml;
    expect(ruledOut[config.slug]).toBeDefined();
    for (const banned of ruledOut[config.slug]) {
      expect(words, banned).not.toContain(banned);
    }
  });

  it("links into the site only through the wordmark, its sheets and its preview", () => {
    const { container } = renderPage();

    const internal = [...container.querySelectorAll("a")]
      .map((a) => a.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("/"));
    expect([...new Set(internal)].sort()).toEqual(
      [
        "/",
        `/${config.slug}/sheets`,
        `/m3/${config.token}/preview`,
        ...sheets.map((sheet) => sheet.file),
      ].sort(),
    );
  });
});

describe("AuditBar", () => {
  const props = {
    book: { label: "Book", href: bookingUrl },
    text: { label: "Text", href: "sms:+13175074303" },
    sheets: { label: "Sheets", href: "#sheets" },
  };

  it("offers book, text and sheets once no primary button is on screen", () => {
    render(<AuditBar {...props} />);

    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["Book", "Text", "Sheets"]);
    expect(links[0]).toHaveAttribute("href", bookingUrl);
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[2]).toHaveAttribute("href", "#sheets");
    // One primary in the bar, the other two quiet.
    expect(links.filter((a) => a.className.includes("bg-cta"))).toHaveLength(1);
  });

  it("steps aside while a primary button is on screen", () => {
    // The test environment reports every observed element as in view.
    render(
      <>
        <a href={bookingUrl} data-primary-action="">
          Book fifteen minutes
        </a>
        <AuditBar {...props} />
      </>,
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("steps aside while a field has focus, so the keyboard never hides it", () => {
    render(
      <>
        <textarea aria-label="reply" />
        <AuditBar {...props} />
      </>,
    );

    act(() => screen.getByRole("textbox").focus());
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    act(() => screen.getByRole("textbox").blur());
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
