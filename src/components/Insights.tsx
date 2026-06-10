"use client";

import type { Insight } from "@/lib/types";

interface InsightsProps {
  insights: Insight[];
  loading: boolean;
  source: "gemini" | "fallback" | null;
  onGenerate: () => void;
}

export default function Insights({
  insights,
  loading,
  source,
  onGenerate,
}: InsightsProps) {
  return (
    <section
      aria-labelledby="insights-heading"
      className="rounded-2xl border border-line bg-surface p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="insights-heading" className="flex items-center gap-2 text-lg font-semibold">
            <span aria-hidden="true">✨</span> Personalised insights
          </h2>
          <p className="text-sm text-muted">
            AI-generated guidance tailored to your footprint.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
        >
          {loading ? "Thinking…" : insights.length ? "Regenerate" : "Get insights"}
        </button>
      </div>

      <div className="mt-5" aria-live="polite" aria-busy={loading}>
        {loading && insights.length === 0 ? (
          <ul className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-20 animate-pulse rounded-xl bg-track"
                aria-hidden="true"
              />
            ))}
          </ul>
        ) : insights.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Tap <strong>Get insights</strong> for personalised, AI-powered ways
            to shrink your footprint.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {insights.map((insight, i) => (
                <li
                  key={`${insight.title}-${i}`}
                  className="rounded-xl border border-line bg-background p-4"
                >
                  <h3 className="font-semibold text-foreground">
                    {insight.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{insight.detail}</p>
                </li>
              ))}
            </ul>
            {source ? (
              <p className="mt-3 text-xs text-muted">
                {source === "gemini"
                  ? "✨ Generated with Google Gemini."
                  : "Showing built-in guidance (set GEMINI_API_KEY for AI-personalised insights)."}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
