import type { CategoryBreakdown } from "@/lib/types";
import { CATEGORY_META, CATEGORY_ORDER, formatKg } from "@/lib/format";

interface DonutChartProps {
  breakdown: CategoryBreakdown;
  totalTonnes: number;
}

/**
 * Lightweight, dependency-free SVG donut chart.
 *
 * Built with stroke-dasharray arcs so it ships zero image assets and a tiny
 * payload. The chart is decorative (aria-hidden); an adjacent data table in the
 * Results component carries the same information for screen readers.
 */
export default function DonutChart({ breakdown, totalTonnes }: DonutChartProps) {
  const total =
    breakdown.transport + breakdown.home + breakdown.food + breakdown.shopping;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // Build cumulative arc offsets without mutating across the render.
  const segments = CATEGORY_ORDER.reduce<
    Array<{ cat: string; dash: number; gap: number; offset: number; color: string }>
  >((acc, cat) => {
    const fraction = total > 0 ? breakdown[cat] / total : 0;
    const dash = fraction * circumference;
    const offset = acc.length ? acc[acc.length - 1].offset - acc[acc.length - 1].dash : 0;
    acc.push({
      cat,
      dash,
      gap: circumference - dash,
      offset,
      color: CATEGORY_META[cat].color,
    });
    return acc;
  }, []);

  return (
    <figure className="flex flex-col items-center gap-4">
      <div className="relative" aria-hidden="true">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="-rotate-90"
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--color-track)"
            strokeWidth="22"
          />
          {segments.map((s) => (
            <circle
              key={s.cat}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {totalTonnes}
          </span>
          <span className="text-xs font-medium text-muted">tonnes CO₂e/yr</span>
        </div>
      </div>
      <figcaption className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {CATEGORY_ORDER.map((cat) => (
          <span key={cat} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: CATEGORY_META[cat].color }}
            />
            <span className="text-muted">{CATEGORY_META[cat].label}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">
              {formatKg(breakdown[cat])}
            </span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
