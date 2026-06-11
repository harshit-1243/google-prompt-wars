import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "./route";
import { DEFAULT_INPUT } from "@/lib/emissions";

const post = (body: unknown, raw?: string) =>
  new Request("http://localhost/api/insights", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });

beforeEach(() => {
  // Force the deterministic fallback path (no live Gemini call in tests).
  vi.stubEnv("GEMINI_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/insights", () => {
  it("returns fallback insights for a valid body without an API key", async () => {
    const res = await POST(post(DEFAULT_INPUT));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe("fallback");
    expect(Array.isArray(data.insights)).toBe(true);
    expect(data.insights.length).toBeGreaterThan(0);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(post(null, "{not json"));
    expect(res.status).toBe(400);
  });

  it("returns 422 for a structurally invalid body", async () => {
    const res = await POST(post({ foo: 1 }));
    expect(res.status).toBe(422);
  });
});
