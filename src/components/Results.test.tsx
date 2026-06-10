// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Results from "./Results";
import { calculateFootprint, DEFAULT_INPUT } from "@/lib/emissions";
import { a11yViolations } from "@/test/axe";

afterEach(cleanup);

const result = calculateFootprint(DEFAULT_INPUT);

describe("Results", () => {
  it("renders the three benchmark comparisons", () => {
    render(<Results result={result} />);
    // Exact label text (the verdict sentence also mentions "global average").
    expect(screen.getByText("1.5°C target")).toBeInTheDocument();
    expect(screen.getByText("India average")).toBeInTheDocument();
    expect(screen.getByText("Global average")).toBeInTheDocument();
  });

  it("provides a screen-reader data table mirroring the chart", () => {
    render(<Results result={result} />);
    const table = screen.getByRole("table", { name: /by category/i });
    expect(table).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Results result={result} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
