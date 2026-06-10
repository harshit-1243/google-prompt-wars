import { describe, it, expect } from "vitest";
import { addSnapshot, trend, type Snapshot } from "./history";

const snap = (savedAt: string, totalKg: number): Snapshot => ({
  savedAt,
  totalKg,
  totalTonnes: Math.round((totalKg / 1000) * 100) / 100,
});

describe("addSnapshot", () => {
  it("appends a new snapshot", () => {
    const out = addSnapshot([], snap("2026-01-01T10:00:00Z", 5000));
    expect(out).toHaveLength(1);
  });

  it("replaces a snapshot saved on the same day", () => {
    const history = [snap("2026-01-01T08:00:00Z", 5000)];
    const out = addSnapshot(history, snap("2026-01-01T20:00:00Z", 4000));
    expect(out).toHaveLength(1);
    expect(out[0].totalKg).toBe(4000);
  });

  it("keeps snapshots from different days", () => {
    const history = [snap("2026-01-01T08:00:00Z", 5000)];
    const out = addSnapshot(history, snap("2026-02-01T08:00:00Z", 4000));
    expect(out).toHaveLength(2);
  });

  it("caps history to the maximum length", () => {
    let history: Snapshot[] = [];
    for (let i = 0; i < 20; i++) {
      history = addSnapshot(history, snap(`2026-${i}`, i * 100), 12);
    }
    expect(history).toHaveLength(12);
  });
});

describe("trend", () => {
  it("returns null with fewer than two snapshots", () => {
    expect(trend([])).toBeNull();
    expect(trend([snap("2026-01-01", 5000)])).toBeNull();
  });

  it("reports a downward trend", () => {
    const t = trend([snap("2026-01-01", 5000), snap("2026-02-01", 4000)]);
    expect(t?.direction).toBe("down");
    expect(t?.deltaKg).toBe(-1000);
    expect(t?.deltaPct).toBe(-20);
  });

  it("reports an upward trend", () => {
    const t = trend([snap("2026-01-01", 4000), snap("2026-02-01", 5000)]);
    expect(t?.direction).toBe("up");
    expect(t?.deltaKg).toBe(1000);
  });

  it("reports a flat trend", () => {
    const t = trend([snap("2026-01-01", 5000), snap("2026-02-01", 5000)]);
    expect(t?.direction).toBe("flat");
    expect(t?.deltaKg).toBe(0);
  });
});
