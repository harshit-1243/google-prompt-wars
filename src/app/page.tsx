"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateFootprint, DEFAULT_INPUT } from "@/lib/emissions";
import type { FootprintInput, Insight } from "@/lib/types";
import { addSnapshot, type Snapshot } from "@/lib/history";
import Calculator from "@/components/Calculator";
import Results from "@/components/Results";
import Insights from "@/components/Insights";
import ActionTracker from "@/components/ActionTracker";
import History from "@/components/History";

const STORAGE_KEY = "ecotrace:v1";

interface PersistedState {
  input: FootprintInput;
  selected: string[];
  history: Snapshot[];
}

function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    // Defensive: never trust the shape of persisted data.
    if (!parsed || typeof parsed !== "object") return null;
    return {
      input:
        parsed.input && typeof parsed.input === "object"
          ? (parsed.input as FootprintInput)
          : DEFAULT_INPUT,
      selected: Array.isArray(parsed.selected) ? parsed.selected : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return null;
  }
}

export default function Home() {
  const [input, setInput] = useState<FootprintInput>(DEFAULT_INPUT);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightSource, setInsightSource] = useState<
    "gemini" | "fallback" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore previous session on mount. Reading localStorage must happen after
  // mount (it is unavailable during SSR); doing it in a lazy initializer would
  // cause a hydration mismatch, so syncing via an effect here is intentional.
  useEffect(() => {
    const saved = loadState();
    /* eslint-disable react-hooks/set-state-in-effect */
    if (saved?.input) setInput(saved.input);
    if (saved?.selected) setSelected(new Set(saved.selected));
    if (saved?.history) setHistory(saved.history);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist whenever input, selected actions, or history change.
  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedState = { input, selected: [...selected], history };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [input, selected, history, hydrated]);

  const result = useMemo(() => calculateFootprint(input), [input]);

  const toggleAction = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const saveSnapshot = () =>
    setHistory((prev) =>
      addSnapshot(prev, {
        savedAt: new Date().toISOString(),
        totalKg: result.totalKg,
        totalTonnes: result.totalTonnes,
      }),
    );

  async function generateInsights() {
    setLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as {
        insights: Insight[];
        source: "gemini" | "fallback";
      };
      setInsights(data.insights ?? []);
      setInsightSource(data.source ?? "fallback");
    } catch {
      setInsights([
        {
          title: "Couldn't reach the insight service",
          detail:
            "Check your connection and try again. Meanwhile, the action list below already shows high-impact steps tailored to your footprint.",
          category: "general",
        },
      ]);
      setInsightSource("fallback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8">
          <p className="flex items-center gap-2 text-sm font-medium text-brand-dark">
            <span aria-hidden="true">🌍</span> EcoTrace
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Understand, track &amp; shrink your carbon footprint
          </h1>
          <p className="max-w-2xl text-muted">
            Answer a few questions about how you live, and see what your choices
            mean for the planet — with personalised, AI-powered ways to do
            better.
          </p>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-5 py-10 lg:grid-cols-[1fr_minmax(360px,400px)]"
      >
        <div className="flex flex-col gap-8">
          <section
            aria-labelledby="calc-heading"
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <h2 id="calc-heading" className="mb-1 text-lg font-semibold">
              Your lifestyle
            </h2>
            <p className="mb-5 text-sm text-muted">
              Estimates use India-specific emission factors. Everything is saved
              on your device — no account needed.
            </p>
            <Calculator value={input} onChange={setInput} />
          </section>

          <Insights
            insights={insights}
            loading={loading}
            source={insightSource}
            onGenerate={generateInsights}
          />

          <ActionTracker
            breakdown={result.breakdown}
            totalKg={result.totalKg}
            selected={selected}
            onToggle={toggleAction}
          />

          <History history={history} onSave={saveSnapshot} />
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <Results result={result} />
          </div>
        </aside>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-6 text-center text-xs text-muted">
          Built for PromptWars: Virtual · Challenge 3 · Powered by Next.js
          &amp; Google Gemini. Figures are awareness-grade estimates, not a
          certified audit.
        </div>
      </footer>
    </div>
  );
}
