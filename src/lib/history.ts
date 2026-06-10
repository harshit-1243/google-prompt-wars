/**
 * Footprint history — the "track over time" half of the problem statement.
 *
 * Pure functions over an array of snapshots so they can be unit-tested. The UI
 * layer is responsible for persistence (localStorage).
 */

export interface Snapshot {
  /** ISO timestamp of when the snapshot was saved. */
  savedAt: string;
  totalKg: number;
  totalTonnes: number;
}

const MAX_SNAPSHOTS = 12;

/**
 * Add a snapshot to the history, newest last. If the most recent snapshot was
 * saved on the same calendar day, it is replaced rather than duplicated. The
 * list is capped to the most recent MAX_SNAPSHOTS entries.
 */
export function addSnapshot(
  history: Snapshot[],
  snapshot: Snapshot,
  max: number = MAX_SNAPSHOTS,
): Snapshot[] {
  const sameDay =
    history.length > 0 &&
    history[history.length - 1].savedAt.slice(0, 10) ===
      snapshot.savedAt.slice(0, 10);

  const base = sameDay ? history.slice(0, -1) : history;
  return [...base, snapshot].slice(-max);
}

export interface Trend {
  deltaKg: number;
  deltaPct: number;
  direction: "down" | "up" | "flat";
}

/** Compare the latest snapshot to the previous one. */
export function trend(history: Snapshot[]): Trend | null {
  if (history.length < 2) return null;
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];
  const deltaKg = latest.totalKg - prev.totalKg;
  const deltaPct = prev.totalKg > 0 ? (deltaKg / prev.totalKg) * 100 : 0;
  return {
    deltaKg: Math.round(deltaKg),
    deltaPct: Math.round(deltaPct * 10) / 10,
    direction: deltaKg < 0 ? "down" : deltaKg > 0 ? "up" : "flat",
  };
}
