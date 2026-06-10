import { GoogleGenAI, Type } from "@google/genai";
import {
  buildPrompt,
  fallbackInsights,
  isValidInput,
  parseModelInsights,
  rateLimit,
} from "@/lib/insights";
import type { FootprintInput } from "@/lib/types";

/**
 * POST /api/insights
 *
 * Generates personalised, educational carbon-reduction insights with Google's
 * Gemini model. The API key is read from the server environment and never
 * reaches the browser. If the key is missing or the model call fails, a
 * deterministic rule-based fallback keeps the deployed demo fully functional.
 */

export const runtime = "nodejs";
// Insights are user-specific and must not be cached.
export const dynamic = "force-dynamic";

const MODEL = "gemini-2.5-flash";

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "anonymous";
}

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request))) {
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidInput(body)) {
    return Response.json(
      { error: "Request body is not a valid footprint input." },
      { status: 422 },
    );
  }
  const input = body as FootprintInput;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ insights: fallbackInsights(input), source: "fallback" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(input),
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              detail: { type: Type.STRING },
              category: {
                type: Type.STRING,
                enum: ["transport", "home", "food", "shopping", "general"],
              },
            },
            required: ["title", "detail", "category"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from model.");
    const insights = parseModelInsights(JSON.parse(text));
    return Response.json({ insights, source: "gemini" });
  } catch (err) {
    console.error("Gemini insight generation failed:", err);
    // Graceful degradation — the user still gets useful, relevant guidance.
    return Response.json({ insights: fallbackInsights(input), source: "fallback" });
  }
}
