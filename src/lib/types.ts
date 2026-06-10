/**
 * Shared domain types for the EcoTrace carbon footprint engine.
 * Kept framework-agnostic so the calculation logic stays easy to unit-test.
 */

export type VehicleType =
  | "none"
  | "two-wheeler"
  | "car-petrol"
  | "car-diesel"
  | "car-electric";

export type DietType = "vegan" | "vegetarian" | "mixed" | "heavy-meat";

export type ShoppingTier = "minimal" | "moderate" | "high";

export type FootprintCategory =
  | "transport"
  | "home"
  | "food"
  | "shopping";

export interface FootprintInput {
  transport: {
    vehicleType: VehicleType;
    kmPerWeek: number;
    transitKmPerWeek: number;
    flightsShortPerYear: number;
    flightsLongPerYear: number;
  };
  home: {
    electricityKwhPerMonth: number;
    /** Share of electricity from renewables/green tariff, 0..1 */
    renewableShare: number;
    lpgCylindersPerMonth: number;
    householdSize: number;
  };
  food: {
    diet: DietType;
  };
  shopping: {
    tier: ShoppingTier;
  };
}

/** Per-category annual emissions, in kg CO2e. */
export type CategoryBreakdown = Record<FootprintCategory, number>;

export interface FootprintResult {
  /** Total annual emissions in kg CO2e. */
  totalKg: number;
  /** Total annual emissions in tonnes CO2e. */
  totalTonnes: number;
  breakdown: CategoryBreakdown;
  /** Category contributions as a percentage of the total (0..100). */
  shares: CategoryBreakdown;
  comparisons: Comparison[];
  equivalencies: Equivalency[];
}

export interface Comparison {
  label: string;
  /** Benchmark annual footprint in tonnes CO2e. */
  tonnes: number;
  /** Ratio of the user's footprint to this benchmark. */
  ratio: number;
  description: string;
}

export interface Equivalency {
  icon: string;
  value: string;
  label: string;
}

export interface ReductionAction {
  id: string;
  category: FootprintCategory;
  title: string;
  description: string;
  /** Estimated annual saving in kg CO2e. */
  savingsKg: number;
  /** Why this matters — the awareness angle. */
  awareness: string;
}

export interface Insight {
  title: string;
  detail: string;
  category: FootprintCategory | "general";
}
