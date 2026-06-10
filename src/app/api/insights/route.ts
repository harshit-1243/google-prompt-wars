import { GoogleGenAI, Type } from "@google/genai";
import { calculateFootprint } from "@/lib/emissions";
import type { FootprintInput, Insight } from "@/lib/types";

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

/** Minimal runtime validation — we never trust client input shape blindly. */
function isValidInput(value: unknown): value is FootprintInput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.transport === "object" &&
    typeof v.home === "object" &&
    typeof v.food === "object" &&
    typeof v.shopping === "object"
  );
}

function buildPrompt(input: FootprintInput): string {
  const result = calculateFootprint(input);
  return [
    "You are a friendly climate-awareness coach for an Indian audience.",
    "Given a person's annual carbon footprint, return 4 short, personalised insights.",
    "Each insight must: name the biggest opportunity, explain WHY it matters in one plain sentence (the awareness angle), and give one concrete, achievable action.",
    "Be encouraging, specific, and non-judgemental. Avoid jargon.",
    "",
    `Total footprint: ${result.totalTonnes} tonnes CO2e/year.`,
    `Breakdown (kg CO2e/year): transport ${result.breakdown.transport}, home ${result.breakdown.home}, food ${result.breakdown.food}, shopping ${result.breakdown.shopping}.`,
    `For context, the 1.5°C-compatible target is ~2.3 tonnes/person/year and the India average is ~2.0 tonnes.`,
    `User profile: diet=${input.food.diet}, vehicle=${input.transport.vehicleType}, shopping=${input.shopping.tier}.`,
  ].join("\n");
}

/** Deterministic, offline insight generation used when Gemini is unavailable. */
function fallbackInsights(input: FootprintInput): Insight[] {
  const { breakdown } = calculateFootprint(input);
  const ranked = (
    Object.entries(breakdown) as Array<[Insight["category"], number]>
  ).sort((a, b) => b[1] - a[1]);

  const library: Record<string, Insight> = {
    transport: {
      title: "Transport is your biggest lever",
      detail:
        "Driving and flights dominate your footprint. Cars emit ~4x more CO₂ per km than the metro — swapping two commutes a week for public transit adds up fast.",
      category: "transport",
    },
    home: {
      title: "Clean up your home energy",
      detail:
        "India's grid is ~70% fossil-powered, so your electricity carries real emissions. Setting the AC to 26°C and exploring a green tariff or rooftop solar cuts this at the source.",
      category: "home",
    },
    food: {
      title: "Small diet shifts, big impact",
      detail:
        "Food is a surprisingly large slice of most footprints. Going meatless a few days a week is one of the highest-impact daily choices you can make.",
      category: "food",
    },
    shopping: {
      title: "Buy less, choose well",
      detail:
        "Fast fashion and gadgets carry hidden 'embodied' carbon from manufacturing. Repairing, reselling, and buying second-hand keeps emissions out of the air.",
      category: "shopping",
    },
  };

  const insights = ranked.slice(0, 3).map(([cat]) => library[cat]);
  insights.push({
    title: "Awareness is the first step",
    detail:
      "You're already ahead just by measuring. Track your footprint monthly — what gets measured gets managed.",
    category: "general",
  });
  return insights;
}

export async function POST(request: Request) {
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
    const parsed = JSON.parse(text) as Insight[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Model returned no insights.");
    }
    return Response.json({ insights: parsed, source: "gemini" });
  } catch (err) {
    console.error("Gemini insight generation failed:", err);
    // Graceful degradation — the user still gets useful, relevant guidance.
    return Response.json({ insights: fallbackInsights(input), source: "fallback" });
  }
}
