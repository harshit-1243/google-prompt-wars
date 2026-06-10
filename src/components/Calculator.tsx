"use client";

import type {
  DietType,
  FootprintInput,
  ShoppingTier,
  VehicleType,
} from "@/lib/types";

interface CalculatorProps {
  value: FootprintInput;
  onChange: (next: FootprintInput) => void;
}

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: "none", label: "No personal vehicle" },
  { value: "two-wheeler", label: "Two-wheeler" },
  { value: "car-petrol", label: "Car — petrol" },
  { value: "car-diesel", label: "Car — diesel" },
  { value: "car-electric", label: "Car — electric" },
];

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "mixed", label: "Mixed (some meat)" },
  { value: "heavy-meat", label: "Heavy meat eater" },
];

const SHOPPING_OPTIONS: { value: ShoppingTier; label: string }[] = [
  { value: "minimal", label: "Minimal — buy rarely" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High — frequent shopper" },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-line bg-surface px-3 py-2 text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30";

export default function Calculator({ value, onChange }: CalculatorProps) {
  const setTransport = (patch: Partial<FootprintInput["transport"]>) =>
    onChange({ ...value, transport: { ...value.transport, ...patch } });
  const setHome = (patch: Partial<FootprintInput["home"]>) =>
    onChange({ ...value, home: { ...value.home, ...patch } });

  const num = (raw: string) => (raw === "" ? 0 : Math.max(0, Number(raw)));

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 flex items-center gap-2 text-base font-semibold">
          <span aria-hidden="true">🚗</span> Transport
        </legend>
        <Field label="Primary vehicle">
          <select
            className={inputClass}
            value={value.transport.vehicleType}
            onChange={(e) =>
              setTransport({ vehicleType: e.target.value as VehicleType })
            }
          >
            {VEHICLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Distance driven per week" hint="kilometres">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className={inputClass}
              value={value.transport.kmPerWeek || ""}
              onChange={(e) => setTransport({ kmPerWeek: num(e.target.value) })}
            />
          </Field>
          <Field label="Public transit per week" hint="kilometres">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className={inputClass}
              value={value.transport.transitKmPerWeek || ""}
              onChange={(e) =>
                setTransport({ transitKmPerWeek: num(e.target.value) })
              }
            />
          </Field>
          <Field label="Domestic flights per year">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className={inputClass}
              value={value.transport.flightsShortPerYear || ""}
              onChange={(e) =>
                setTransport({ flightsShortPerYear: num(e.target.value) })
              }
            />
          </Field>
          <Field label="International flights per year">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className={inputClass}
              value={value.transport.flightsLongPerYear || ""}
              onChange={(e) =>
                setTransport({ flightsLongPerYear: num(e.target.value) })
              }
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 flex items-center gap-2 text-base font-semibold">
          <span aria-hidden="true">🏠</span> Home energy
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Electricity per month" hint="kWh — check your bill">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className={inputClass}
              value={value.home.electricityKwhPerMonth || ""}
              onChange={(e) =>
                setHome({ electricityKwhPerMonth: num(e.target.value) })
              }
            />
          </Field>
          <Field label="LPG cylinders per month">
            <input
              type="number"
              min={0}
              step="0.5"
              inputMode="decimal"
              className={inputClass}
              value={value.home.lpgCylindersPerMonth || ""}
              onChange={(e) =>
                setHome({ lpgCylindersPerMonth: num(e.target.value) })
              }
            />
          </Field>
          <Field label="People in household">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              className={inputClass}
              value={value.home.householdSize || ""}
              onChange={(e) =>
                setHome({ householdSize: Math.max(1, num(e.target.value)) })
              }
            />
          </Field>
          <Field
            label={`Renewable share: ${Math.round(value.home.renewableShare * 100)}%`}
            hint="Solar or green tariff"
          >
            <input
              type="range"
              min={0}
              max={100}
              className="accent-brand"
              value={Math.round(value.home.renewableShare * 100)}
              aria-label="Renewable electricity share percentage"
              onChange={(e) =>
                setHome({ renewableShare: Number(e.target.value) / 100 })
              }
            />
          </Field>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="🍽️ Diet">
          <select
            className={inputClass}
            value={value.food.diet}
            onChange={(e) =>
              onChange({ ...value, food: { diet: e.target.value as DietType } })
            }
          >
            {DIET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="🛍️ Shopping habits">
          <select
            className={inputClass}
            value={value.shopping.tier}
            onChange={(e) =>
              onChange({
                ...value,
                shopping: { tier: e.target.value as ShoppingTier },
              })
            }
          >
            {SHOPPING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}
