/**
 * Helpers for the "Ask EcoTrace" feature — a grounded Q&A that answers the
 * user's own climate questions using their footprint as context (Gemini).
 *
 * Pure + framework-free so the route stays thin and the logic is unit-tested.
 */

import { calculateFootprint } from "./emissions";
import { CATEGORY_META } from "./format";
import type { CategoryBreakdown, FootprintInput } from "./types";

export const MAX_QUESTION_LENGTH = 300;

/** Trim, collapse whitespace and cap length of an untrusted question string. */
export function sanitizeQuestion(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_QUESTION_LENGTH);
}

export function isValidQuestion(raw: unknown): boolean {
  const q = sanitizeQuestion(raw);
  return q.length > 0;
}

function biggestCategory(breakdown: CategoryBreakdown) {
  return (Object.entries(breakdown) as Array<[keyof CategoryBreakdown, number]>).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
}

export function buildExplainPrompt(
  question: string,
  input: FootprintInput,
): string {
  const result = calculateFootprint(input);
  return [
    "You are EcoTrace, a friendly climate-awareness assistant for an Indian audience.",
    "Answer the user's question in 2-3 short sentences, in plain language.",
    "Ground your answer in their personal footprint data below where relevant, and always tie it back to a practical, encouraging takeaway.",
    "If the question is unrelated to climate, sustainability or their footprint, gently steer back to those topics.",
    "",
    `Their annual footprint: ${result.totalTonnes} tonnes CO2e.`,
    `Breakdown (kg/yr): transport ${result.breakdown.transport}, home ${result.breakdown.home}, food ${result.breakdown.food}, shopping ${result.breakdown.shopping}.`,
    "",
    `Question: ${question}`,
  ].join("\n");
}

/** Deterministic answer used when Gemini is unavailable. */
export function fallbackAnswer(input: FootprintInput): string {
  const { breakdown } = calculateFootprint(input);
  const cat = biggestCategory(breakdown);
  const label = CATEGORY_META[cat].label.toLowerCase();
  return `Right now, ${label} is the biggest part of your footprint, so that's where small changes go furthest. Try one concrete swap this week and re-check your footprint — measuring your progress is the best way to stay motivated. (Set GEMINI_API_KEY to get fuller, AI-personalised answers.)`;
}
