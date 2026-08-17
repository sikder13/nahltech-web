import { describe, expect, it } from "vitest";

import {
  LEAD_FORM_TOKEN,
  extractLeadSignal,
  renderAssistantText,
} from "./chat-format";

/**
 * The two production defects from CC-CHAT-1's QA, at unit level.
 *
 * These are cheap and total in a way the widget tests cannot be: every shape
 * the model might emit is a string, so every case is one line. The widget
 * tests then prove the panel actually calls this on the right text.
 */

describe("extractLeadSignal", () => {
  it("reports no signal and changes nothing when the token is absent", () => {
    const reply = "The audit is $2,500 and credits toward the build.";
    expect(extractLeadSignal(reply)).toEqual({ text: reply, requested: false });
  });

  it("takes the token off the end, with the blank line it sat on", () => {
    const { text, requested } = extractLeadSignal(
      `Great — drop your details below and the team will reach out.\n\n${LEAD_FORM_TOKEN}`,
    );

    expect(requested).toBe(true);
    expect(text).toBe(
      "Great — drop your details below and the team will reach out.",
    );
    expect(text).not.toContain("[[");
  });

  it("removes the token wherever the model put it, including mid-reply", () => {
    // Instructed to end with it; a model that ignores that must not leak it.
    const { text, requested } = extractLeadSignal(
      `${LEAD_FORM_TOKEN}\nSomeone will call you.`,
    );

    expect(requested).toBe(true);
    expect(text).toBe("Someone will call you.");
  });

  it("removes a token the model emitted twice", () => {
    const { text } = extractLeadSignal(
      `Ready when you are.\n${LEAD_FORM_TOKEN}\n${LEAD_FORM_TOKEN}`,
    );
    expect(text).toBe("Ready when you are.");
  });

  it("leaves prose that merely mentions brackets alone", () => {
    const reply = "Use [[ and ]] freely, they mean nothing here.";
    expect(extractLeadSignal(reply).requested).toBe(false);
  });
});

describe("renderAssistantText", () => {
  it("drops the asterisks that reached production as literal punctuation", () => {
    expect(renderAssistantText("The **audit** is **$2,500**.")).toBe(
      "The audit is $2,500.",
    );
  });

  it("drops a leading bullet marker, hyphen or asterisk", () => {
    expect(renderAssistantText("- one\n- two\n* three")).toBe(
      "one\ntwo\nthree",
    );
  });

  it("keeps the blank lines that separate paragraphs", () => {
    // The prompt's only permitted formatting; the panel renders it with
    // `whitespace-pre-line`, so it has to survive this function.
    expect(renderAssistantText("First paragraph.\n\nSecond paragraph.")).toBe(
      "First paragraph.\n\nSecond paragraph.",
    );
  });

  it("does not eat a hyphen that is doing a hyphen's job", () => {
    expect(renderAssistantText("A fixed-price build, 2-3 weeks.")).toBe(
      "A fixed-price build, 2-3 weeks.",
    );
  });

  it("hides a token that is still streaming in", () => {
    // Mid-stream frames: the token arrives a few characters at a time and
    // must never be legible in the panel, not even for one frame.
    for (let length = 1; length < LEAD_FORM_TOKEN.length; length += 1) {
      const partial = `Call you tomorrow.\n${LEAD_FORM_TOKEN.slice(0, length)}`;
      expect(renderAssistantText(partial), partial).toBe("Call you tomorrow.");
    }
  });

  it("hides the completed token too, in case it reaches the renderer", () => {
    expect(renderAssistantText(`Done.\n${LEAD_FORM_TOKEN}`)).not.toContain(
      "LEAD_FORM",
    );
  });
});
