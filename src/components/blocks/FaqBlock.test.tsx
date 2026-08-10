import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FaqBlock } from "./FaqBlock";

const items = [
  { question: "First question", answer: "First answer" },
  { question: "Second question", answer: "Second answer" },
];

function panelFor(question: string) {
  const button = screen.getByRole("button", { name: new RegExp(question) });
  return document.getElementById(button.getAttribute("aria-controls") ?? "");
}

describe("FaqBlock", () => {
  it("renders each question as a heading with a collapsed button", () => {
    render(<FaqBlock heading="Questions" items={items} />);

    for (const item of items) {
      const heading = screen.getByRole("heading", {
        level: 3,
        name: new RegExp(item.question),
      });
      expect(heading).toBeInTheDocument();

      const button = screen.getByRole("button", {
        name: new RegExp(item.question),
      });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(panelFor(item.question)).toHaveAttribute("hidden");
    }
  });

  it("opens and closes with the keyboard and keeps aria-expanded honest", async () => {
    const user = userEvent.setup();
    render(<FaqBlock heading="Questions" items={items} />);

    const button = screen.getByRole("button", { name: /First question/ });

    // Tab reaches the trigger without any custom key handling.
    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panelFor("First question")).not.toHaveAttribute("hidden");

    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panelFor("First question")).toHaveAttribute("hidden");

    // Space toggles too, since it is a native button.
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("labels each answer region with its own question", async () => {
    const user = userEvent.setup();
    render(<FaqBlock heading="Questions" items={items} />);

    await user.click(screen.getByRole("button", { name: /Second question/ }));

    const region = screen.getByRole("region", { name: /Second question/ });
    expect(region).toHaveTextContent("Second answer");
  });

  it("opens items independently", async () => {
    const user = userEvent.setup();
    render(<FaqBlock heading="Questions" items={items} />);

    await user.click(screen.getByRole("button", { name: /First question/ }));
    await user.click(screen.getByRole("button", { name: /Second question/ }));

    // Opening the second must not close the first.
    expect(
      screen.getByRole("button", { name: /First question/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /Second question/ }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
