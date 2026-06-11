// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ActionTracker from "./ActionTracker";
import { calculateFootprint, DEFAULT_INPUT } from "@/lib/emissions";
import { REDUCTION_ACTIONS } from "@/lib/actions";
import { a11yViolations } from "@/test/axe";

afterEach(cleanup);

const result = calculateFootprint(DEFAULT_INPUT);

describe("ActionTracker", () => {
  it("renders every reduction action as a checkbox", () => {
    render(
      <ActionTracker
        breakdown={result.breakdown}
        totalKg={result.totalKg}
        selected={new Set()}
        onToggle={() => {}}
      />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(
      REDUCTION_ACTIONS.length,
    );
  });

  it("calls onToggle with an action id when checked", () => {
    const onToggle = vi.fn();
    render(
      <ActionTracker
        breakdown={result.breakdown}
        totalKg={result.totalKg}
        selected={new Set()}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(typeof onToggle.mock.calls[0][0]).toBe("string");
  });

  it("reflects selected actions as checked", () => {
    const selected = new Set([REDUCTION_ACTIONS[0].id]);
    render(
      <ActionTracker
        breakdown={result.breakdown}
        totalKg={result.totalKg}
        selected={selected}
        onToggle={() => {}}
      />,
    );
    const checked = screen
      .getAllByRole("checkbox")
      .filter((c) => (c as HTMLInputElement).checked);
    expect(checked.length).toBe(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ActionTracker
        breakdown={result.breakdown}
        totalKg={result.totalKg}
        selected={new Set()}
        onToggle={() => {}}
      />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
