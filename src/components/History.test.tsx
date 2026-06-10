// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import History from "./History";
import type { Snapshot } from "@/lib/history";
import { a11yViolations } from "@/test/axe";

afterEach(cleanup);

const sample: Snapshot[] = [
  { savedAt: "2026-01-01T10:00:00Z", totalKg: 5000, totalTonnes: 5 },
  { savedAt: "2026-02-01T10:00:00Z", totalKg: 4000, totalTonnes: 4 },
];

describe("History", () => {
  it("shows an empty state with no snapshots", () => {
    render(<History history={[]} onSave={() => {}} />);
    expect(screen.getByText(/No snapshots yet/i)).toBeInTheDocument();
  });

  it("reports a downward trend", () => {
    render(<History history={sample} onSave={() => {}} />);
    expect(screen.getByText(/Down/i)).toBeInTheDocument();
  });

  it("calls onSave when the button is clicked", () => {
    const onSave = vi.fn();
    render(<History history={[]} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: /Save snapshot/i }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <History history={sample} onSave={() => {}} />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
