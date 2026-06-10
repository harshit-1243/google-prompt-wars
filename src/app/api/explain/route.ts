import { GoogleGenAI } from "@google/genai";
import {
  buildExplainPrompt,
  fallbackAnswer,
  isValidQuestion,
  sanitizeQuestion,
} from "@/lib/explain";
import { isValidInput, rateLimit } from "@/lib/insights";
import type { FootprintInput } from "@/lib/types";

/**
 * POST /api/explain — grounded climate Q&A powered by Google Gemini.
 * Body: { question: string, input: FootprintInput }
 * The API key is server-only; missing key / failures fall back gracefully.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gemini-2.5-flash";

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "anonymous";
}

export async function POST(request: Request) {
  if (!rateLimit(`explain:${clientKey(request)}`)) {
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { question, input } = (body ?? {}) as {
    question?: unknown;
    input?: unknown;
  };

  if (!isValidQuestion(question) || !isValidInput(input)) {
    return Response.json(
      { error: "A non-empty question and a valid footprint are required." },
      { status: 422 },
    );
  }

  const cleanQuestion = sanitizeQuestion(question);
  const footprint = input as FootprintInput;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ answer: fallbackAnswer(footprint), source: "fallback" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildExplainPrompt(cleanQuestion, footprint),
      config: { temperature: 0.5, maxOutputTokens: 300 },
    });
    const answer = response.text?.trim();
    if (!answer) throw new Error("Empty response from model.");
    return Response.json({ answer, source: "gemini" });
  } catch (err) {
    console.error("Gemini explain failed:", err);
    return Response.json({ answer: fallbackAnswer(footprint), source: "fallback" });
  }
}
