import { describe, expect, it } from "vitest";

import { getDictionary } from "./get-dictionary";

describe("getDictionary", () => {
  it("returns the populated English dictionary", async () => {
    const dictionary = await getDictionary("en");

    expect(dictionary.site.name).toBe("Nahl Technologies");
    expect(dictionary.nav.services).toBe("Services");
    expect(dictionary.footer.email).toBe("info@nahltech.com");
    expect(Object.keys(dictionary.pages)).toHaveLength(17);
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
