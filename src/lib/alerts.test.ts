import { describe, expect, it } from "vitest";

import { singleLine } from "./alerts";

/**
 * Header-injection guard for the lead alert email.
 *
 * The alert is the one place visitor-controlled text leaves the system into a
 * different protocol. Everything else about a lead ends up in Postgres through
 * a parameterised client, where a newline is just a newline.
 */
describe("singleLine", () => {
  it("strips the classic header-injection payload", () => {
    // If this ever reaches a Subject line intact, the visitor is choosing our
    // outbound mail headers.
    expect(singleLine("X\r\nBcc: evil@example.com")).toBe(
      "X Bcc: evil@example.com",
    );
    expect(singleLine("X\r\nBcc: evil@example.com")).not.toContain("\r");
    expect(singleLine("X\r\nBcc: evil@example.com")).not.toContain("\n");
  });

  it("strips bare CR and bare LF, not just the pair", () => {
    expect(singleLine("a\nb")).toBe("a b");
    expect(singleLine("a\rb")).toBe("a b");
  });

  it("strips the Unicode line separators some clients honour", () => {
    expect(singleLine("a\u2028b")).toBe("a b");
    expect(singleLine("a\u2029b")).toBe("a b");
  });

  it("strips other control characters and DEL", () => {
    expect(singleLine("a\u0000b\u007fc")).toBe("abc");
  });

  it("collapses runs of whitespace and trims", () => {
    expect(singleLine("  a \t\t b  ")).toBe("a b");
  });

  it("treats null and undefined as empty", () => {
    expect(singleLine(null)).toBe("");
    expect(singleLine(undefined)).toBe("");
  });

  it("leaves ordinary values alone", () => {
    expect(singleLine("Redbud Heating & Air")).toBe("Redbud Heating & Air");
  });
});
