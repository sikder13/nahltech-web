import { describe, expect, it } from "vitest";

import { parseReply } from "./parse-reply";

describe("parseReply", () => {
  it("finds a phone number in the common groupings", () => {
    expect(parseReply("317-555-0142").phone).toBe("317-555-0142");
    expect(parseReply("(317) 555-0142 after four").phone).toBe(
      "(317) 555-0142",
    );
    expect(parseReply("call 3175550142").phone).toBe("3175550142");
    expect(parseReply("+1 317.555.0142").phone).toBe("+1 317.555.0142");
  });

  it("finds an email address", () => {
    expect(parseReply("kendall@example.org, mornings are best").email).toBe(
      "kendall@example.org",
    );
  });

  it("finds both when both are typed", () => {
    expect(parseReply("a.march@example.com or 317 555 0142")).toEqual({
      email: "a.march@example.com",
      phone: "317 555 0142",
    });
  });

  it("does not read digits inside an address as a phone number", () => {
    expect(parseReply("write to 3175550142@example.com")).toEqual({
      email: "3175550142@example.com",
      phone: null,
    });
  });

  it("returns neither for a line with no contact detail", () => {
    expect(parseReply("Wrong on the overtime figure")).toEqual({
      email: null,
      phone: null,
    });
  });

  it("does not take a longer run of digits for a phone number", () => {
    expect(parseReply("ticket 31755501429988").phone).toBeNull();
  });
});
