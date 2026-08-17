import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { markScriptRuns } from "./ScriptText";

function html(text: string): string {
  const { container } = render(<p>{markScriptRuns(text)}</p>);
  return container.innerHTML;
}

describe("markScriptRuns", () => {
  it("leaves English alone, with no wrapper", () => {
    // A document full of pointless spans helps nobody, and the vast majority
    // of the site's copy passes through here.
    expect(html("We're an AI consulting company in Indianapolis.")).toBe(
      "<p>We're an AI consulting company in Indianapolis.</p>",
    );
  });

  it("wraps a Bengali run and nothing around it", () => {
    const { container } = render(
      <p>{markScriptRuns("Hafsa Sastho (হাফসা স্বাস্থ্য) is an app.")}</p>,
    );
    const span = container.querySelector('[lang="bn"]');

    expect(span?.textContent).toBe("হাফসা স্বাস্থ্য");
    // The parenthesis belongs to the English sentence, not to the name.
    expect(container.textContent).toBe(
      "Hafsa Sastho (হাফসা স্বাস্থ্য) is an app.",
    );
  });

  it("keeps the space inside a two-word name but not the one after it", () => {
    const { container } = render(<p>{markScriptRuns("নাম টি here")}</p>);
    expect(container.querySelector('[lang="bn"]')?.textContent).toBe("নাম টি");
  });

  it("handles several runs in one sentence", () => {
    const { container } = render(<p>{markScriptRuns("এক and দুই")}</p>);
    const spans = [...container.querySelectorAll('[lang="bn"]')];

    expect(spans.map((s) => s.textContent)).toEqual(["এক", "দুই"]);
    expect(container.textContent).toBe("এক and দুই");
  });

  it("is not left holding regex state between calls", () => {
    // The pattern is global and module-level, so a stale lastIndex would make
    // every other call miss. This is the bug that would show up as "the name
    // renders on the about page but not in the test suite".
    const first = html("হাফসা");
    const second = html("হাফসা");
    expect(second).toBe(first);
    expect(second).toContain('lang="bn"');
  });
});
