/**
 * Pure helpers powering the /api/insights route.
 *
 * Kept framework-free (no Next/Gemini imports) so they can be unit-tested in
 * isolation and reused by the route handler. The route layer only deals with
 * HTTP plumbing and the actual model call.
 */

import { calculateFootprint } from "./emissions";
import type { DietType, FootprintInput, Insight, ShoppingTier, VehicleType } from "./types";

const VEHICLES: VehicleType[] = [
  "none",
  "two-wheeler",
  "car-petrol",
  "car-diesel",
  "car-electric",
];
const DIETS: DietType[] = ["vegan", "vegetarian", "mixed", "heavy-meat"];
const TIERS: ShoppingTier[] = ["minimal", "moderate", "high"];

const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

/**
 * Strict, defensive validation of a footprint payload from an untrusted client.
 * Checks structure, field types and enum membership — not just object presence.
 */
export function isValidInput(value: unknown): value is FootprintInput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, Record<string, unknown>>;
  const { transport, home, food, shopping } = v;
  if (!transport || !home || !food || !shopping) return false;

  return (
    VEHICLES.includes(transport.vehicleType as VehicleType) &&
    isFiniteNumber(transport.kmPerWeek) &&
    isFiniteNumber(transport.transitKmPerWeek) &&
    isFiniteNumber(transport.flightsShortPerYear) &&
    isFiniteNumber(transport.flightsLongPerYear) &&
    isFiniteNumber(home.electricityKwhPerMonth) &&
    isFiniteNumber(home.renewableShare) &&
    isFiniteNumber(home.lpgCylindersPerMonth) &&
    isFiniteNumber(home.householdSize) &&
    DIETS.includes(food.diet as DietType) &&
    TIERS.includes(shopping.tier as ShoppingTier)
  );
}

export function buildPrompt(input: FootprintInput): string {
  const result = calculateFootprint(input);
  return [
    "You are a friendly climate-awareness coach for an Indian audience.",
    "Given a person's annual carbon footprint, return 4 short, personalised insights.",
    "Each insight must: name the biggest opportunity, explain WHY it matters in one plain sentence (the awareness angle), and give one concrete, achievable action.",
    "Be encouraging, specific, and non-judgemental. Avoid jargon.",
    "",
    `Total footprint: ${result.totalTonnes} tonnes CO2e/year.`,
    `Breakdown (kg CO2e/year): transport ${result.breakdown.transport}, home ${result.breakdown.home}, food ${result.breakdown.food}, shopping ${result.breakdown.shopping}.`,
    `For context, the 1.5°C-compatible target is ~2.3 tonnes/person/year and the India average is ~2.0 tonnes.`,
    `User profile: diet=${input.food.diet}, vehicle=${input.transport.vehicleType}, shopping=${input.shopping.tier}.`,
  ].join("\n");
}

/** Deterministic, offline insight generation used when Gemini is unavailable. */
export function fallbackInsights(input: FootprintInput): Insight[] {
  const { breakdown } = calculateFootprint(input);
  const ranked = (
    Object.entries(breakdown) as Array<[Insight["category"], number]>
  ).sort((a, b) => b[1] - a[1]);

  const library: Record<string, Insight> = {
    transport: {
      title: "Transport is your biggest lever",
      detail:
        "Driving and flights dominate your footprint. Cars emit ~4x more CO₂ per km than the metro — swapping two commutes a week for public transit adds up fast.",
      category: "transport",
    },
    home: {
      title: "Clean up your home energy",
      detail:
        "India's grid is ~70% fossil-powered, so your electricity carries real emissions. Setting the AC to 26°C and exploring a green tariff or rooftop solar cuts this at the source.",
      category: "home",
    },
    food: {
      title: "Small diet shifts, big impact",
      detail:
        "Food is a surprisingly large slice of most footprints. Going meatless a few days a week is one of the highest-impact daily choices you can make.",
      category: "food",
    },
    shopping: {
      title: "Buy less, choose well",
      detail:
        "Fast fashion and gadgets carry hidden 'embodied' carbon from manufacturing. Repairing, reselling, and buying second-hand keeps emissions out of the air.",
      category: "shopping",
    },
  };

  const insights = ranked.slice(0, 3).map(([cat]) => library[cat]);
  insights.push({
    title: "Awareness is the first step",
    detail:
      "You're already ahead just by measuring. Track your footprint monthly — what gets measured gets managed.",
    category: "general",
  });
  return insights;
}

/** Validate and normalise insights returned by the model. */
export function parseModelInsights(raw: unknown): Insight[] {
  if (!Array.isArray(raw)) throw new Error("Model response is not an array.");
  const insights = raw.filter(
    (i): i is Insight =>
      !!i &&
      typeof i.title === "string" &&
      typeof i.detail === "string" &&
      typeof i.category === "string",
  );
  if (insights.length === 0) throw new Error("Model returned no usable insights.");
  return insights;
}

/**
 * Tiny fixed-window in-memory rate limiter. Keyed by client identifier.
 * Note: serverless instances each keep their own window — this is a pragmatic
 * abuse guard for a hobby deployment, not a distributed limiter.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, now: number = Date.now()): boolean {
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

/** Test-only helper to reset limiter state between cases. */
export function __resetRateLimit(): void {
  hits.clear();
}
