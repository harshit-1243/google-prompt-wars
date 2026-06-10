"use client";

import { REDUCTION_ACTIONS, totalSavings, prioritisedActions } from "@/lib/actions";
import type { CategoryBreakdown } from "@/lib/types";
import { CATEGORY_META, formatKg } from "@/lib/format";

interface ActionTrackerProps {
  breakdown: CategoryBreakdown;
  totalKg: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export default function ActionTracker({
  breakdown,
  totalKg,
  selected,
  onToggle,
}: ActionTrackerProps) {
  const actions = prioritisedActions(breakdown);
  const saved = totalSavings(selected);
  const projected = Math.max(0, totalKg - saved);
  const pctCut = totalKg > 0 ? Math.round((saved / totalKg) * 100) : 0;

  return (
    <section
      aria-labelledby="actions-heading"
      className="rounded-2xl border border-line bg-surface p-6"
    >
      <h2 id="actions-heading" className="flex items-center gap-2 text-lg font-semibold">
        <span aria-hidden="true">🎯</span> Simple actions, real impact
      </h2>
      <p className="text-sm text-muted">
        Tick the changes you can commit to and watch your projected footprint
        drop.
      </p>

      <div className="mt-4 rounded-xl bg-brand/10 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Projected footprint
            </p>
            <p className="text-2xl font-bold tabular-nums text-brand-dark">
              {formatKg(projected)}
              <span className="ml-1 text-sm font-normal text-muted">
                /year
              </span>
            </p>
          </div>
          <p className="text-right text-sm font-semibold text-brand-dark">
            −{formatKg(saved)}
            <span className="block text-xs font-normal text-muted">
              {pctCut}% cut
            </span>
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-track"
          role="img"
          aria-label={`${pctCut} percent reduction selected`}
        >
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.min(100, pctCut)}%` }}
          />
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {actions.map((action) => {
          const checked = selected.has(action.id);
          const meta = CATEGORY_META[action.category];
          return (
            <li key={action.id}>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? "border-brand bg-brand/5"
                    : "border-line hover:border-brand/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(action.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-brand"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {action.title}
                    <span
                      className="flex items-center gap-1 rounded-full bg-track px-2 py-0.5 text-xs font-semibold text-foreground"
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                        aria-hidden="true"
                      />
                      −{action.savingsKg} kg/yr
                    </span>
                  </span>
                  <span className="text-sm text-muted">{action.description}</span>
                  <span className="mt-1 text-xs text-muted">
                    <span aria-hidden="true">💡 </span>
                    {action.awareness}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Showing {REDUCTION_ACTIONS.length} actions, ordered by impact for your
        biggest emission sources.
      </p>
    </section>
  );
}
