"use client";

import type { Snapshot } from "@/lib/history";
import { trend } from "@/lib/history";
import { formatKg } from "@/lib/format";

interface HistoryProps {
  history: Snapshot[];
  onSave: () => void;
}

function Sparkline({ history }: { history: Snapshot[] }) {
  const values = history.map((h) => h.totalKg);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 280;
  const h = 60;
  const step = values.length > 1 ? w / (values.length - 1) : 0;

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-16 w-full"
      role="img"
      aria-label={`Footprint trend over your last ${values.length} saved snapshots`}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * (h - 8) - 4;
        return (
          <circle key={i} cx={x} cy={y} r="2.5" fill="var(--color-brand)" />
        );
      })}
    </svg>
  );
}

export default function History({ history, onSave }: HistoryProps) {
  const t = trend(history);

  return (
    <section
      aria-labelledby="history-heading"
      className="rounded-2xl border border-line bg-surface p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="history-heading" className="flex items-center gap-2 text-lg font-semibold">
            <span aria-hidden="true">📈</span> Track your progress
          </h2>
          <p className="text-sm text-muted">
            Save a snapshot and watch your footprint change over time.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="shrink-0 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand/10 focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          Save snapshot
        </button>
      </div>

      {history.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          No snapshots yet. Tap <strong>Save snapshot</strong> to start tracking
          your footprint month to month.
        </p>
      ) : (
        <div className="mt-4">
          {t ? (
            <p
              className={`mb-2 text-sm font-semibold ${
                t.direction === "down"
                  ? "text-brand-dark"
                  : t.direction === "up"
                    ? "text-danger"
                    : "text-muted"
              }`}
            >
              {t.direction === "down"
                ? `▼ Down ${formatKg(Math.abs(t.deltaKg))} (${Math.abs(t.deltaPct)}%) since last time — great work!`
                : t.direction === "up"
                  ? `▲ Up ${formatKg(Math.abs(t.deltaKg))} (${Math.abs(t.deltaPct)}%) since last time.`
                  : "No change since your last snapshot."}
            </p>
          ) : (
            <p className="mb-2 text-sm text-muted">
              Save another snapshot later to see your trend.
            </p>
          )}
          <Sparkline history={history} />
          <ol className="mt-3 flex flex-col gap-1 text-sm">
            {[...history].reverse().slice(0, 5).map((s) => (
              <li
                key={s.savedAt}
                className="flex items-center justify-between border-b border-line py-1 last:border-0"
              >
                <span className="text-muted">
                  {new Date(s.savedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="font-medium tabular-nums text-foreground">
                  {s.totalTonnes} t
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
