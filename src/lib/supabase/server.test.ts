import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: () => ({ marker: "real-client" }) })),
}));

async function loadServerModule() {
  const loaded = await import("./server");
  loaded.resetSupabaseAdminForTests();
  return loaded;
}

describe("supabaseAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("imports cleanly with no credentials present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    // `next build` evaluates every route module while collecting page data,
    // including force-dynamic ones. Throwing at import time would fail the
    // build in CI, which has no Supabase credentials and does not need them.
    await expect(loadServerModule()).resolves.toBeDefined();
  });

  it("throws a named error on first use when a variable is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { supabaseAdmin } = await loadServerModule();

    // Precise and named, rather than an opaque 401 from PostgREST later on.
    expect(() => supabaseAdmin.from("leads")).toThrow(
      /Missing required environment variable SUPABASE_SERVICE_ROLE_KEY/,
    );
  });

  it("constructs the client once the credentials are present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const { supabaseAdmin } = await loadServerModule();

    expect(supabaseAdmin.from("leads")).toEqual({ marker: "real-client" });
  });
});
