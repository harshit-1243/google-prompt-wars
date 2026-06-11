import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "./route";
import { DEFAULT_INPUT } from "@/lib/emissions";

const post = (body: unknown, raw?: string) =>
  new Request("http://localhost/api/explain", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/explain", () => {
  it("returns a fallback answer for a valid question without an API key", async () => {
    const res = await POST(
      post({ question: "Why do flights matter?", input: DEFAULT_INPUT }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe("fallback");
    expect(typeof data.answer).toBe("string");
    expect(data.answer.length).toBeGreaterThan(0);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(post(null, "{nope"));
    expect(res.status).toBe(400);
  });

  it("returns 422 when the question is empty", async () => {
    const res = await POST(post({ question: "   ", input: DEFAULT_INPUT }));
    expect(res.status).toBe(422);
  });

  it("returns 422 when the footprint is invalid", async () => {
    const res = await POST(
      post({ question: "Valid question?", input: { bad: 1 } }),
    );
    expect(res.status).toBe(422);
  });
});
