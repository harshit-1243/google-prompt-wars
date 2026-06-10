import { describe, it, expect } from "vitest";
import {
  calculateFootprint,
  transportEmissions,
  homeEmissions,
  foodEmissions,
  shoppingEmissions,
  DEFAULT_INPUT,
  VEHICLE_FACTORS,
  GRID_FACTOR_KWH,
  DIET_FACTORS,
} from "./emissions";
import { totalSavings, prioritisedActions, REDUCTION_ACTIONS } from "./actions";
import type { FootprintInput } from "./types";

const emptyInput: FootprintInput = {
  transport: {
    vehicleType: "none",
    kmPerWeek: 0,
    transitKmPerWeek: 0,
    flightsShortPerYear: 0,
    flightsLongPerYear: 0,
  },
  home: {
    electricityKwhPerMonth: 0,
    renewableShare: 0,
    lpgCylindersPerMonth: 0,
    householdSize: 1,
  },
  food: { diet: "vegan" },
  shopping: { tier: "minimal" },
};

describe("transportEmissions", () => {
  it("multiplies weekly driving by 52 weeks and the vehicle factor", () => {
    const kg = transportEmissions({
      vehicleType: "car-petrol",
      kmPerWeek: 100,
      transitKmPerWeek: 0,
      flightsShortPerYear: 0,
      flightsLongPerYear: 0,
    });
    expect(kg).toBeCloseTo(100 * 52 * VEHICLE_FACTORS["car-petrol"]);
  });

  it("adds fixed emissions per flight", () => {
    const kg = transportEmissions({
      vehicleType: "none",
      kmPerWeek: 0,
      transitKmPerWeek: 0,
      flightsShortPerYear: 2,
      flightsLongPerYear: 1,
    });
    expect(kg).toBe(2 * 250 + 1 * 1700);
  });

  it("treats negative inputs as zero", () => {
    const kg = transportEmissions({
      vehicleType: "car-petrol",
      kmPerWeek: -500,
      transitKmPerWeek: -10,
      flightsShortPerYear: -3,
      flightsLongPerYear: 0,
    });
    expect(kg).toBe(0);
  });
});

describe("homeEmissions", () => {
  it("divides household emissions by the number of people", () => {
    const perPerson = homeEmissions({
      electricityKwhPerMonth: 200,
      renewableShare: 0,
      lpgCylindersPerMonth: 0,
      householdSize: 4,
    });
    const expected = (200 * 12 * GRID_FACTOR_KWH) / 4;
    expect(perPerson).toBeCloseTo(expected);
  });

  it("reduces electricity emissions by the renewable share", () => {
    const full = homeEmissions({
      electricityKwhPerMonth: 100,
      renewableShare: 0,
      lpgCylindersPerMonth: 0,
      householdSize: 1,
    });
    const half = homeEmissions({
      electricityKwhPerMonth: 100,
      renewableShare: 0.5,
      lpgCylindersPerMonth: 0,
      householdSize: 1,
    });
    expect(half).toBeCloseTo(full / 2);
  });

  it("never divides by less than one person", () => {
    const kg = homeEmissions({
      electricityKwhPerMonth: 100,
      renewableShare: 0,
      lpgCylindersPerMonth: 0,
      householdSize: 0,
    });
    expect(kg).toBeCloseTo(100 * 12 * GRID_FACTOR_KWH);
  });
});

describe("foodEmissions & shoppingEmissions", () => {
  it("returns the diet factor", () => {
    expect(foodEmissions({ diet: "heavy-meat" })).toBe(DIET_FACTORS["heavy-meat"]);
  });
  it("orders diets from low to high impact", () => {
    expect(DIET_FACTORS.vegan).toBeLessThan(DIET_FACTORS.vegetarian);
    expect(DIET_FACTORS.vegetarian).toBeLessThan(DIET_FACTORS.mixed);
    expect(DIET_FACTORS.mixed).toBeLessThan(DIET_FACTORS["heavy-meat"]);
  });
  it("returns the shopping tier factor", () => {
    expect(shoppingEmissions({ tier: "high" })).toBe(2000);
  });
});

describe("calculateFootprint", () => {
  it("sums all categories into the total", () => {
    const r = calculateFootprint(DEFAULT_INPUT);
    const sum =
      r.breakdown.transport +
      r.breakdown.home +
      r.breakdown.food +
      r.breakdown.shopping;
    expect(r.totalKg).toBeCloseTo(sum, 0);
  });

  it("converts kg to tonnes", () => {
    const r = calculateFootprint(DEFAULT_INPUT);
    expect(r.totalTonnes).toBeCloseTo(r.totalKg / 1000, 2);
  });

  it("produces shares that sum to ~100%", () => {
    const r = calculateFootprint(DEFAULT_INPUT);
    const total =
      r.shares.transport + r.shares.home + r.shares.food + r.shares.shopping;
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it("handles an all-zero footprint without dividing by zero", () => {
    const r = calculateFootprint(emptyInput);
    expect(r.totalKg).toBe(DIET_FACTORS.vegan + 300); // diet + minimal shopping
    expect(Number.isNaN(r.shares.food)).toBe(false);
  });

  it("always returns the three benchmark comparisons", () => {
    const r = calculateFootprint(DEFAULT_INPUT);
    expect(r.comparisons).toHaveLength(3);
    expect(r.comparisons.every((c) => c.ratio > 0)).toBe(true);
  });

  it("provides tangible equivalencies", () => {
    const r = calculateFootprint(DEFAULT_INPUT);
    expect(r.equivalencies.length).toBeGreaterThanOrEqual(3);
  });
});

describe("reduction actions", () => {
  it("sums savings only for selected ids", () => {
    const [a, b] = REDUCTION_ACTIONS;
    expect(totalSavings([a.id, b.id])).toBe(a.savingsKg + b.savingsKg);
  });

  it("ignores unknown ids", () => {
    expect(totalSavings(["does-not-exist"])).toBe(0);
  });

  it("prioritises actions for the largest-emitting category", () => {
    const sorted = prioritisedActions({
      transport: 5000,
      home: 100,
      food: 100,
      shopping: 100,
    });
    expect(sorted[0].category).toBe("transport");
  });
});
