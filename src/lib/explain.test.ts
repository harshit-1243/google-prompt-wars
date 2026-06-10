import { describe, it, expect } from "vitest";
import {
  sanitizeQuestion,
  isValidQuestion,
  buildExplainPrompt,
  fallbackAnswer,
  MAX_QUESTION_LENGTH,
} from "./explain";
import { DEFAULT_INPUT } from "./emissions";

describe("sanitizeQuestion", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeQuestion("  why   so   high?  ")).toBe("why so high?");
  });

  it("caps length to the maximum", () => {
    const long = "a".repeat(500);
    expect(sanitizeQuestion(long)).toHaveLength(MAX_QUESTION_LENGTH);
  });

  it("returns an empty string for non-strings", () => {
    expect(sanitizeQuestion(123)).toBe("");
    expect(sanitizeQuestion(null)).toBe("");
    expect(sanitizeQuestion(undefined)).toBe("");
  });
});

describe("isValidQuestion", () => {
  it("accepts a real question", () => {
    expect(isValidQuestion("What helps most?")).toBe(true);
  });
  it("rejects empty / whitespace / non-strings", () => {
    expect(isValidQuestion("   ")).toBe(false);
    expect(isValidQuestion("")).toBe(false);
    expect(isValidQuestion(42)).toBe(false);
  });
});

describe("buildExplainPrompt", () => {
  it("includes the question and grounding data", () => {
    const prompt = buildExplainPrompt("Why flights?", DEFAULT_INPUT);
    expect(prompt).toContain("Question: Why flights?");
    expect(prompt).toContain("tonnes CO2e");
  });
});

describe("fallbackAnswer", () => {
  it("names the biggest category and stays non-empty", () => {
    const answer = fallbackAnswer({
      ...DEFAULT_INPUT,
      transport: {
        ...DEFAULT_INPUT.transport,
        kmPerWeek: 3000,
        flightsLongPerYear: 6,
      },
    });
    expect(answer.toLowerCase()).toContain("transport");
    expect(answer.length).toBeGreaterThan(0);
  });
});
