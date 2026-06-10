import type { FootprintResult } from "@/lib/types";
import { CATEGORY_META, CATEGORY_ORDER, formatKg } from "@/lib/format";
import DonutChart from "./DonutChart";

interface ResultsProps {
  result: FootprintResult;
}

function ComparisonBar({
  label,
  ratio,
  description,
}: {
  label: string;
  ratio: number;
  description: string;
}) {
  const pct = Math.min(100, Math.round((1 / Math.max(ratio, 0.01)) * 100));
  const over = ratio > 1;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span
          className={`font-semibold tabular-nums ${
            over ? "text-danger" : "text-brand"
          }`}
        >
          {ratio.toFixed(1)}×
        </span>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-track"
        role="img"
        aria-label={`Your footprint is ${ratio.toFixed(1)} times the ${label}`}
      >
        <div
          className={`h-full rounded-full ${over ? "bg-danger" : "bg-brand"}`}
          style={{ width: `${over ? 100 : pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}

export default function Results({ result }: ResultsProps) {
  const verdict =
    result.totalTonnes <= 2.3
      ? { text: "On track for 1.5°C — brilliant!", tone: "text-brand" }
      : result.totalTonnes <= 4.7
        ? { text: "Below the global average, but above the 1.5°C target.", tone: "text-warn" }
        : { text: "Above the global average — plenty of room to cut.", tone: "text-danger" };

  return (
    <section aria-labelledby="results-heading" className="flex flex-col gap-8">
      <div>
        <h2 id="results-heading" className="text-lg font-semibold">
          Your annual footprint
        </h2>
        <p className={`text-sm font-medium ${verdict.tone}`}>{verdict.text}</p>
      </div>

      <DonutChart
        breakdown={result.breakdown}
        totalTonnes={result.totalTonnes}
      />

      {/* Visually-hidden accessible table mirroring the donut chart data. */}
      <table className="sr-only">
        <caption>Carbon footprint by category, kg CO₂e per year</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">kg CO₂e/year</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORY_ORDER.map((cat) => (
            <tr key={cat}>
              <th scope="row">{CATEGORY_META[cat].label}</th>
              <td>{Math.round(result.breakdown[cat])}</td>
              <td>{result.shares[cat]}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          How you compare
        </h3>
        <div className="flex flex-col gap-4">
          {result.comparisons.map((c) => (
            <ComparisonBar
              key={c.label}
              label={c.label}
              ratio={c.ratio}
              description={c.description}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          What that actually means
        </h3>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {result.equivalencies.map((eq) => (
            <li
              key={eq.label}
              className="rounded-xl border border-line bg-surface p-4 text-center"
            >
              <span className="text-2xl" aria-hidden="true">
                {eq.icon}
              </span>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {eq.value}
              </p>
              <p className="text-xs text-muted">{eq.label}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Total: <strong>{formatKg(result.totalKg)}</strong> CO₂e per year.
        </p>
      </div>
    </section>
  );
}
