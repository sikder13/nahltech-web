import { describe, expect, it } from "vitest";

import { getDictionary } from "./get-dictionary";

import { routes } from "@/lib/routes";

describe("getDictionary", () => {
  it("returns the populated English dictionary", async () => {
    const dictionary = await getDictionary("en");

    expect(dictionary.site.name).toBe("Nahl Technologies");
    expect(dictionary.nav.services).toBe("Services");
    expect(dictionary.footer.email).toBe("info@nahltech.com");
    // Every route must have a page entry — asserted against the registry so
    // adding or removing a service cannot leave this behind.
    expect(Object.keys(dictionary.pages).sort()).toEqual(
      Object.keys(routes).sort(),
    );
  });

  it("throws for a locale that is not configured at all", async () => {
    await expect(getDictionary("xx")).rejects.toThrow(
      'No dictionary for locale "xx"',
    );
  });

  it("throws for a configured locale that has no content yet", async () => {
    // ar and bn are routable concepts but must never render: an empty
    // dictionary would ship blank UI, so loading one is an error.
    await expect(getDictionary("ar")).rejects.toThrow(
      'No dictionary for locale "ar"',
    );
    await expect(getDictionary("bn")).rejects.toThrow(
      'No dictionary for locale "bn"',
    );
  });
});
