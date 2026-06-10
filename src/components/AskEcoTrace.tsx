"use client";

import { useId, useState } from "react";
import type { FootprintInput } from "@/lib/types";
import { MAX_QUESTION_LENGTH } from "@/lib/explain";

interface AskEcoTraceProps {
  input: FootprintInput;
}

const SUGGESTIONS = [
  "Why does my diet matter so much?",
  "Is an electric car really cleaner in India?",
  "What's the single best change I can make?",
];

export default function AskEcoTrace({ input }: AskEcoTraceProps) {
  const inputId = useId();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, input }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      setAnswer(
        data.answer ??
          data.error ??
          "Sorry, I couldn't answer that — please try again.",
      );
    } catch {
      setAnswer("Couldn't reach the assistant. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="ask-heading"
      className="rounded-2xl border border-line bg-surface p-6"
    >
      <h2 id="ask-heading" className="flex items-center gap-2 text-lg font-semibold">
        <span aria-hidden="true">💬</span> Ask EcoTrace
      </h2>
      <p className="text-sm text-muted">
        Curious about anything climate-related? Ask, and Google Gemini answers
        using your footprint as context.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Your climate question
        </label>
        <input
          id={inputId}
          type="text"
          value={question}
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How much does flying really add up?"
          className="flex-1 rounded-lg border border-line bg-background px-3 py-2 text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuestion(s);
              void ask(s);
            }}
            className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-brand hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-track" aria-hidden="true" />
        ) : answer ? (
          <p className="rounded-xl border border-line bg-background p-4 text-sm text-foreground">
            {answer}
          </p>
        ) : null}
      </div>
    </section>
  );
}
