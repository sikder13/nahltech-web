import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { track } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const tracked = vi.mocked(track);

/** A fresh copy of the module, as a new page load would get. */
async function loadHook() {
  vi.resetModules();
  const { useCalculatorUse } = await import("./use-calculator-use");
  return useCalculatorUse;
}

beforeEach(() => {
  tracked.mockClear();
  sessionStorage.clear();
});

describe("useCalculatorUse", () => {
  it("reports calculator_use on the first interaction only", async () => {
    const useCalculatorUse = await loadHook();
    const { result } = renderHook(() => useCalculatorUse("pricing"));

    result.current();
    result.current();
    result.current();

    expect(tracked).toHaveBeenCalledTimes(1);
    expect(tracked).toHaveBeenCalledWith({
      name: "calculator_use",
      calculator: "pricing",
    });
  });

  it("does not report on mount", async () => {
    const useCalculatorUse = await loadHook();
    renderHook(() => useCalculatorUse("pricing"));

    expect(tracked).not.toHaveBeenCalled();
  });

  it("stays quiet on a later page in the same session", async () => {
    const first = await loadHook();
    renderHook(() => first("pricing")).result.current();

    const second = await loadHook();
    renderHook(() => second("roi")).result.current();

    expect(tracked).toHaveBeenCalledTimes(1);
  });

  it("still reports once when session storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const useCalculatorUse = await loadHook();
    const { result } = renderHook(() => useCalculatorUse("pricing"));

    result.current();
    result.current();

    expect(tracked).toHaveBeenCalledTimes(1);
  });
});
