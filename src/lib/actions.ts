/**
 * Catalogue of simple, real-world reduction actions.
 *
 * Each action carries an awareness note explaining *why* it matters — the
 * platform's goal is understanding, not just a to-do list. Savings are
 * conservative annual estimates in kg CO2e.
 */

import type { CategoryBreakdown, ReductionAction } from "./types";

export const REDUCTION_ACTIONS: ReductionAction[] = [
  {
    id: "transit-commute",
    category: "transport",
    title: "Swap 2 car commutes a week for public transit",
    description: "Take the metro or bus instead of driving twice a week.",
    savingsKg: 320,
    awareness:
      "Transport is one of the fastest-growing sources of emissions in Indian cities. A single shared metro trip emits ~4x less CO₂ per km than a private car.",
  },
  {
    id: "meatless-days",
    category: "food",
    title: "Go meatless 3 days a week",
    description: "Replace meat with plant-based meals three days each week.",
    savingsKg: 300,
    awareness:
      "Producing 1 kg of red meat can emit 50–100 kg CO₂e. Shifting even part of your diet is one of the highest-impact personal choices.",
  },
  {
    id: "led-ac",
    category: "home",
    title: "Set AC to 26°C and switch to LEDs",
    description: "Every degree higher on the AC cuts energy use by ~6%.",
    savingsKg: 250,
    awareness:
      "Cooling is the biggest driver of India's rising household electricity demand. Small thermostat changes scale to huge grid-level savings.",
  },
  {
    id: "green-tariff",
    category: "home",
    title: "Switch to a green electricity tariff or rooftop solar",
    description: "Source part of your electricity from renewables.",
    savingsKg: 700,
    awareness:
      "India's grid is ~70% fossil-powered. Moving your home's electricity to renewables removes emissions at the source.",
  },
  {
    id: "fewer-flights",
    category: "transport",
    title: "Take one fewer short flight a year",
    description: "Choose train or video calls over a domestic flight.",
    savingsKg: 250,
    awareness:
      "A single short-haul return flight can emit as much as a month of an average person's other activities combined.",
  },
  {
    id: "slow-fashion",
    category: "shopping",
    title: "Buy half as many new clothes",
    description: "Repair, resell, or buy second-hand instead of new.",
    savingsKg: 200,
    awareness:
      "Fast fashion is responsible for ~10% of global emissions. Extending a garment's life by 9 months cuts its footprint by ~30%.",
  },
  {
    id: "air-dry",
    category: "home",
    title: "Air-dry clothes instead of machine drying",
    description: "Skip the dryer and use a line or rack.",
    savingsKg: 120,
    awareness:
      "Tumble dryers are among the most energy-hungry home appliances. Air-drying is free and effectively zero-carbon.",
  },
  {
    id: "local-seasonal",
    category: "food",
    title: "Eat local & seasonal produce",
    description: "Choose locally grown, in-season fruits and vegetables.",
    savingsKg: 150,
    awareness:
      "Out-of-season and air-freighted food can carry many times the emissions of local produce due to transport and cold storage.",
  },
];

/** Total potential annual saving (kg CO2e) for a set of selected action ids. */
export function totalSavings(selectedIds: Iterable<string>): number {
  const ids = new Set(selectedIds);
  return REDUCTION_ACTIONS.filter((a) => ids.has(a.id)).reduce(
    (sum, a) => sum + a.savingsKg,
    0,
  );
}

/**
 * Suggest the most relevant actions first, based on which categories dominate
 * a user's footprint. Larger contributors surface higher.
 */
export function prioritisedActions(
  breakdown: CategoryBreakdown,
): ReductionAction[] {
  return [...REDUCTION_ACTIONS].sort(
    (a, b) => (breakdown[b.category] ?? 0) - (breakdown[a.category] ?? 0),
  );
}
