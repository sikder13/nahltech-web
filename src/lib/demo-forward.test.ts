import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import sitemap from "@/app/sitemap";

import { robotsTxt } from "./robots-txt";

/**
 * /demo forwards to private pages prepared for individual businesses and
 * deployed from elsewhere. This repository is public, so it carries the
 * forwarding rule and nothing about what is behind it. These tests hold the
 * edges of that: where the forward points, that it is marked noindex, and
 * that nothing on the site leads a visitor or a crawler there.
 */

async function loadConfig() {
  vi.resetModules();
  return (await import("../../next.config")).default;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/demo forwarding", () => {
  it("forwards /demo/* to the origin named in the environment", async () => {
    vi.stubEnv("DEMO_ORIGIN", "https://demo-origin.example/ignored/path");
    const config = await loadConfig();
    expect(await config.rewrites?.()).toEqual([
      {
        source: "/demo/:path*",
        destination: "https://demo-origin.example/demo/:path*",
      },
    ]);
  });

  it.each([
    ["unset", ""],
    ["not a URL", "demo-origin"],
    ["not https", "http://demo-origin.example"],
  ])("adds no rule when DEMO_ORIGIN is %s", async (_name, value) => {
    vi.stubEnv("DEMO_ORIGIN", value);
    const config = await loadConfig();
    expect(await config.rewrites?.()).toEqual([]);
  });

  it("marks every /demo response noindex, assets included", async () => {
    const config = await loadConfig();
    const rules = (await config.headers?.()) ?? [];
    for (const source of ["/demo", "/demo/:path*"]) {
      const rule = rules.find((r) => r.source === source);
      expect(rule?.headers, source).toContainEqual({
        key: "X-Robots-Tag",
        value: "noindex, nofollow",
      });
    }
  });

  it("names no address in the repository", () => {
    const config = readFileSync(
      path.join(process.cwd(), "next.config.ts"),
      "utf8",
    );
    expect(config).not.toMatch(/vercel\.app/);
  });
});

describe("/demo stays out of sight", () => {
  it("is disallowed in robots.txt", () => {
    expect(robotsTxt()).toContain("Disallow: /demo/");
  });

  it("is not in the sitemap", () => {
    for (const entry of sitemap()) {
      expect(new URL(entry.url).pathname.startsWith("/demo")).toBe(false);
    }
  });

  it("is not in llms.txt", () => {
    const llms = readFileSync(
      path.join(process.cwd(), "public", "llms.txt"),
      "utf8",
    );
    expect(llms).not.toMatch(/\/demo(\/|\b)/);
  });

  it("is linked from no page, component or piece of content", () => {
    const roots = ["src/app", "src/components", "src/lib/i18n", "content"];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const file = path.join(dir, name);
        if (statSync(file).isDirectory()) walk(file);
        else if (
          /\.(tsx?|mdx?|json)$/.test(name) &&
          !/\.test\.tsx?$/.test(name) &&
          !file.includes(path.join("api", "demo-visit")) &&
          /["'(]\/demo(\/|["')#?])/.test(readFileSync(file, "utf8"))
        ) {
          offenders.push(file);
        }
      }
    };
    for (const root of roots) walk(path.join(process.cwd(), root));
    expect(offenders).toEqual([]);
  });
});
