import { describe, it, expect, beforeEach } from "vitest";
import {
  isValidInput,
  fallbackInsights,
  parseModelInsights,
  buildPrompt,
  rateLimit,
  __resetRateLimit,
} from "./insights";
import { DEFAULT_INPUT } from "./emissions";

describe("isValidInput", () => {
  it("accepts a well-formed footprint input", () => {
    expect(isValidInput(DEFAULT_INPUT)).toBe(true);
  });

  it("rejects null, primitives and arrays", () => {
    expect(isValidInput(null)).toBe(false);
    expect(isValidInput(42)).toBe(false);
    expect(isValidInput("nope")).toBe(false);
    expect(isValidInput([])).toBe(false);
  });

  it("rejects missing sections", () => {
    expect(isValidInput({ transport: {}, home: {}, food: {} })).toBe(false);
  });

  it("rejects invalid enum values", () => {
    const bad = {
      ...DEFAULT_INPUT,
      transport: { ...DEFAULT_INPUT.transport, vehicleType: "rocket" },
    };
    expect(isValidInput(bad)).toBe(false);
  });

  it("rejects non-finite numeric fields", () => {
    const bad = {
      ...DEFAULT_INPUT,
      home: { ...DEFAULT_INPUT.home, electricityKwhPerMonth: "lots" },
    };
    expect(isValidInput(bad)).toBe(false);
  });
});

describe("fallbackInsights", () => {
  it("returns four insights ending with a general one", () => {
    const insights = fallbackInsights(DEFAULT_INPUT);
    expect(insights).toHaveLength(4);
    expect(insights[insights.length - 1].category).toBe("general");
  });

  it("leads with the largest-emitting category", () => {
    const heavyTransport = {
      ...DEFAULT_INPUT,
      transport: {
        ...DEFAULT_INPUT.transport,
        kmPerWeek: 2000,
        flightsLongPerYear: 5,
      },
    };
    expect(fallbackInsights(heavyTransport)[0].category).toBe("transport");
  });
});

describe("parseModelInsights", () => {
  it("keeps well-formed insights", () => {
    const out = parseModelInsights([
      { title: "a", detail: "b", category: "food" },
    ]);
    expect(out).toHaveLength(1);
  });

  it("filters out malformed entries", () => {
    const out = parseModelInsights([
      { title: "a", detail: "b", category: "food" },
      { title: 123, detail: "b", category: "food" },
      null,
    ]);
    expect(out).toHaveLength(1);
  });

  it("throws on non-arrays and empty results", () => {
    expect(() => parseModelInsights({})).toThrow();
    expect(() => parseModelInsights([])).toThrow();
  });
});

describe("buildPrompt", () => {
  it("includes the computed total and profile", () => {
    const prompt = buildPrompt(DEFAULT_INPUT);
    expect(prompt).toContain("tonnes CO2e/year");
    expect(prompt).toContain(`diet=${DEFAULT_INPUT.food.diet}`);
  });
});

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimit());

  it("allows up to the limit then blocks", () => {
    const key = "1.2.3.4";
    for (let i = 0; i < 10; i++) {
      expect(rateLimit(key)).toBe(true);
    }
    expect(rateLimit(key)).toBe(false);
  });

  it("resets after the time window passes", () => {
    const key = "5.6.7.8";
    const t0 = 1_000_000;
    for (let i = 0; i < 10; i++) rateLimit(key, t0);
    expect(rateLimit(key, t0)).toBe(false);
    expect(rateLimit(key, t0 + 61_000)).toBe(true);
  });

  it("tracks separate clients independently", () => {
    expect(rateLimit("a")).toBe(true);
    expect(rateLimit("b")).toBe(true);
  });
});
