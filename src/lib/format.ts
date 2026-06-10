import type { FootprintCategory } from "./types";

export interface CategoryMeta {
  label: string;
  icon: string;
  /** Accent colour used for charts and chips. */
  color: string;
}

export const CATEGORY_META: Record<FootprintCategory, CategoryMeta> = {
  transport: { label: "Transport", icon: "🚗", color: "#0ea5e9" },
  home: { label: "Home energy", icon: "🏠", color: "#f59e0b" },
  food: { label: "Food & diet", icon: "🍽️", color: "#22c55e" },
  shopping: { label: "Shopping", icon: "🛍️", color: "#a855f7" },
};

export const CATEGORY_ORDER: FootprintCategory[] = [
  "transport",
  "home",
  "food",
  "shopping",
];

/** Format kg CO2e with thousands separators (Indian locale). */
export function formatKg(kg: number): string {
  return `${Math.round(kg).toLocaleString("en-IN")} kg`;
}

export function formatTonnes(tonnes: number): string {
  return `${tonnes.toLocaleString("en-IN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} t`;
}
