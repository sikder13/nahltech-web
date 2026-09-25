import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * EckCo is frozen.
 *
 * The EckCo dashboard shipped with a printed letter on September 24, 2026,
 * and the letter describes the page as it is. Every file the page is built
 * from is pinned here to the exact bytes that shipped, so an edit to any of
 * them fails the build before it can reach the page. New features go in
 * template 2 (`/m2`, `src/lib/dashboards/v2`, `src/components/dashboard/v2`).
 *
 * The companion check, `scripts/check-eckco-frozen.mjs`, runs after the
 * build and compares the rendered page itself with the production output,
 * which also covers the shared site footer and styles.
 *
 * If a change to EckCo is ever deliberate and approved, update the hash
 * here and the golden file in the same commit, and say so in the message.
 */
const SHIPPED: Record<string, string> = {
  "content/dashboards/eckco.json":
    "55fb5f12f320566a0ae131404374f40da0d2c91eadf8693fed36b74976c64677",
  "content/dashboards/_shared.json":
    "ab2536a69eb94c41a155272ec4f6a0b66872483f6f6047597f4856a556e43e6b",
  "src/lib/dashboards/expression.ts":
    "de5235bcc4a273a1d29dc32e80c2e788975d7931a2ba7398597eff6d1b5f55cf",
  "src/lib/dashboards/model.ts":
    "f6602639da0ae9786ae5500ff4ee0c8855bc3dd934f370a6d208d6a66e159ca6",
  "src/lib/dashboards/schema.ts":
    "acfd5cd3f57c1bdbf6f75d67257b6ea86d470855ffe84bdba56d6d6a3133d2f6",
  "src/lib/dashboards/registry.ts":
    "70f3e72e168a1c67e8b3f6e7f3033031d53e8c2ae82e7371e974421d4676dab3",
  "src/components/dashboard/CalibrationModel.tsx":
    "02806650ed86e90111fa8a5baa90cca364cfef11c40d555fc54bec658df8b2e2",
  "src/components/dashboard/EvidenceLabel.tsx":
    "f5502751a1177aec4ef6820eff6e7832dab1d5e811a771c55a3dc400d92a58eb",
  "src/components/dashboard/RangeSlider.tsx":
    "5ab0fa183aeacacad09e3c265419156ab700ed4c89fcc077cb295332a4b1dbda",
  "src/components/dashboard/RangeSlider.module.css":
    "639988dca65025ba88d8282e85c957eec5575da2b90527dad804c29740bbe301",
  "src/components/dashboard/SeriesChart.tsx":
    "e545969e3436f9a268c40ad55ff487ba4ee01e24829e3de06461a9abab2efd75",
  "src/components/dashboard/VisitBeacon.tsx":
    "5a4e238f5bd1092e64cfff6d298d1cfa9217362bf493cff769dbbe7df1bc45f2",
  "src/app/m/layout.tsx":
    "1409e9fcce181a6b48789c84dfc2efbf63e34d12427f8e136929712b01c13a0a",
  "src/app/m/[token]/page.tsx":
    "d8de0bcaec2a35e6b5f90efa78a015840ac2ba20478eea6bcdb6ef16b19898a7",
  "src/app/api/visit/route.ts":
    "5754767b616de762f100cd5f091e911caf984e92171a0ae3c03716a9ff143b13",
};

describe("EckCo is frozen", () => {
  for (const [file, hash] of Object.entries(SHIPPED)) {
    it(`${file} is byte-identical to what shipped`, () => {
      expect(
        createHash("sha256").update(readFileSync(file)).digest("hex"),
      ).toBe(hash);
    });
  }
});
