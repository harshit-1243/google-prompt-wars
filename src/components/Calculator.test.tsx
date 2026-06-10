// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Calculator from "./Calculator";
import { DEFAULT_INPUT } from "@/lib/emissions";
import { a11yViolations } from "@/test/axe";

afterEach(cleanup);

describe("Calculator", () => {
  it("renders labelled, accessible form controls", () => {
    render(<Calculator value={DEFAULT_INPUT} onChange={() => {}} />);
    expect(
      screen.getByRole("combobox", { name: /Primary vehicle/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: /Distance driven per week/i }),
    ).toBeInTheDocument();
  });

  it("emits updated input when a number field changes", () => {
    const onChange = vi.fn();
    render(<Calculator value={DEFAULT_INPUT} onChange={onChange} />);
    const field = screen.getByRole("spinbutton", {
      name: /People in household/i,
    });
    fireEvent.change(field, { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        home: expect.objectContaining({ householdSize: 3 }),
      }),
    );
  });

  it("emits updated diet when the select changes", () => {
    const onChange = vi.fn();
    render(<Calculator value={DEFAULT_INPUT} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox", { name: /Diet/i }), {
      target: { value: "vegan" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ food: { diet: "vegan" } }),
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Calculator value={DEFAULT_INPUT} onChange={() => {}} />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
