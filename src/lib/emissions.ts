/**
 * Carbon footprint calculation engine.
 *
 * All emission factors are expressed in kg CO2e and tuned for an Indian
 * audience (the PromptWars: Virtual target audience). Sources are noted inline;
 * figures are intentionally rounded, well-documented estimates suitable for an
 * awareness tool rather than a certified carbon audit.
 *
 * This module is pure (no I/O, no framework imports) so it can be unit-tested
 * in isolation and reused on both server and client.
 */

import type {
  CategoryBreakdown,
  Comparison,
  Equivalency,
  FootprintInput,
  FootprintResult,
  VehicleType,
} from "./types";

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

/** kg CO2e per km travelled, by vehicle type. */
export const VEHICLE_FACTORS: Record<VehicleType, number> = {
  none: 0,
  "two-wheeler": 0.045,
  "car-petrol": 0.171,
  "car-diesel": 0.168,
  "car-electric": 0.045, // reflects India's coal-heavy grid (~0.71 kg/kWh)
};

/** kg CO2e per km for shared public transport (bus / metro average). */
export const TRANSIT_FACTOR_PER_KM = 0.045;

/** kg CO2e per return flight. */
export const FLIGHT_SHORT_KG = 250; // ~domestic return, e.g. Delhi–Mumbai
export const FLIGHT_LONG_KG = 1700; // ~international return, medium-haul

/** India grid electricity emission factor, kg CO2e per kWh. */
export const GRID_FACTOR_KWH = 0.71;

/** kg CO2e per 14.2 kg LPG cylinder (production + combustion). */
export const LPG_CYLINDER_KG = 42.5;

/** Annual kg CO2e from diet, per person. */
export const DIET_FACTORS = {
  vegan: 1000,
  vegetarian: 1400,
  mixed: 2200,
  "heavy-meat": 3300,
} as const;

/** Annual kg CO2e from shopping / consumer goods, per person. */
export const SHOPPING_FACTORS = {
  minimal: 300,
  moderate: 900,
  high: 2000,
} as const;

/** Reference annual per-capita footprints, in tonnes CO2e. */
export const BENCHMARKS = {
  /** Per-capita target compatible with limiting warming to 1.5°C by 2030. */
  target1_5C: 2.3,
  indiaAverage: 2.0,
  globalAverage: 4.7,
} as const;

/** A mature tree sequesters roughly this much CO2 per year (kg). */
const TREE_KG_PER_YEAR = 21;

const round = (n: number, dp = 0): number => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

const clampNonNegative = (n: number): number =>
  Number.isFinite(n) && n > 0 ? n : 0;

/** Annual transport emissions (kg CO2e). */
export function transportEmissions(input: FootprintInput["transport"]): number {
  const driving =
    clampNonNegative(input.kmPerWeek) *
    WEEKS_PER_YEAR *
    VEHICLE_FACTORS[input.vehicleType];
  const transit =
    clampNonNegative(input.transitKmPerWeek) *
    WEEKS_PER_YEAR *
    TRANSIT_FACTOR_PER_KM;
  const flights =
    clampNonNegative(input.flightsShortPerYear) * FLIGHT_SHORT_KG +
    clampNonNegative(input.flightsLongPerYear) * FLIGHT_LONG_KG;
  return driving + transit + flights;
}

/** Annual home-energy emissions per person (kg CO2e). */
export function homeEmissions(input: FootprintInput["home"]): number {
  const household = Math.max(1, Math.floor(clampNonNegative(input.householdSize) || 1));
  const renewable = Math.min(1, Math.max(0, input.renewableShare || 0));
  const electricity =
    clampNonNegative(input.electricityKwhPerMonth) *
    MONTHS_PER_YEAR *
    GRID_FACTOR_KWH *
    (1 - renewable);
  const lpg =
    clampNonNegative(input.lpgCylindersPerMonth) *
    MONTHS_PER_YEAR *
    LPG_CYLINDER_KG;
  return (electricity + lpg) / household;
}

/** Annual diet emissions per person (kg CO2e). */
export function foodEmissions(input: FootprintInput["food"]): number {
  return DIET_FACTORS[input.diet] ?? DIET_FACTORS.mixed;
}

/** Annual shopping / goods emissions per person (kg CO2e). */
export function shoppingEmissions(input: FootprintInput["shopping"]): number {
  return SHOPPING_FACTORS[input.tier] ?? SHOPPING_FACTORS.moderate;
}

function buildComparisons(totalTonnes: number): Comparison[] {
  const entries: Array<Omit<Comparison, "ratio">> = [
    {
      label: "1.5°C target",
      tonnes: BENCHMARKS.target1_5C,
      description:
        "The per-person annual budget the world needs to hit by 2030 to keep warming under 1.5°C.",
    },
    {
      label: "India average",
      tonnes: BENCHMARKS.indiaAverage,
      description: "Average annual carbon footprint per person in India.",
    },
    {
      label: "Global average",
      tonnes: BENCHMARKS.globalAverage,
      description: "Average annual carbon footprint per person worldwide.",
    },
  ];
  return entries.map((e) => ({
    ...e,
    ratio: e.tonnes > 0 ? totalTonnes / e.tonnes : 0,
  }));
}

function buildEquivalencies(totalKg: number): Equivalency[] {
  const trees = Math.max(1, Math.round(totalKg / TREE_KG_PER_YEAR));
  const carKm = Math.round(totalKg / VEHICLE_FACTORS["car-petrol"]);
  const flights = totalKg / FLIGHT_SHORT_KG;
  return [
    {
      icon: "🌳",
      value: trees.toLocaleString("en-IN"),
      label: `trees needed for a year to absorb this much CO₂`,
    },
    {
      icon: "🚗",
      value: `${carKm.toLocaleString("en-IN")} km`,
      label: "of driving a petrol car produces the same emissions",
    },
    {
      icon: "✈️",
      value: flights.toFixed(1),
      label: "domestic return flights (e.g. Delhi–Mumbai) equivalent",
    },
  ];
}

/**
 * Calculate a complete footprint result from raw user input.
 * Returns per-category emissions, percentage shares, benchmark comparisons,
 * and tangible real-world equivalencies for the awareness layer.
 */
export function calculateFootprint(input: FootprintInput): FootprintResult {
  const breakdown: CategoryBreakdown = {
    transport: round(transportEmissions(input.transport)),
    home: round(homeEmissions(input.home)),
    food: round(foodEmissions(input.food)),
    shopping: round(shoppingEmissions(input.shopping)),
  };

  const totalKg = round(
    breakdown.transport + breakdown.home + breakdown.food + breakdown.shopping,
  );
  const totalTonnes = round(totalKg / 1000, 2);

  const shares: CategoryBreakdown = {
    transport: 0,
    home: 0,
    food: 0,
    shopping: 0,
  };
  if (totalKg > 0) {
    (Object.keys(breakdown) as Array<keyof CategoryBreakdown>).forEach((k) => {
      shares[k] = round((breakdown[k] / totalKg) * 100, 1);
    });
  }

  return {
    totalKg,
    totalTonnes,
    breakdown,
    shares,
    comparisons: buildComparisons(totalTonnes),
    equivalencies: buildEquivalencies(totalKg),
  };
}

/** Sensible starting values that represent a typical urban Indian household. */
export const DEFAULT_INPUT: FootprintInput = {
  transport: {
    vehicleType: "car-petrol",
    kmPerWeek: 100,
    transitKmPerWeek: 30,
    flightsShortPerYear: 2,
    flightsLongPerYear: 0,
  },
  home: {
    electricityKwhPerMonth: 250,
    renewableShare: 0,
    lpgCylindersPerMonth: 1,
    householdSize: 4,
  },
  food: { diet: "mixed" },
  shopping: { tier: "moderate" },
};
