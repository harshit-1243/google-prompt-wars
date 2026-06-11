// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Insights from "./Insights";
import type { Insight } from "@/lib/types";
import { a11yViolations } from "@/test/axe";

afterEach(cleanup);

const sample: Insight[] = [
  { title: "Transport tip", detail: "Take the metro.", category: "transport" },
  { title: "Diet tip", detail: "Eat less meat.", category: "food" },
];

describe("Insights", () => {
  it("shows an empty prompt and triggers generation", () => {
    const onGenerate = vi.fn();
    render(
      <Insights
        insights={[]}
        loading={false}
        source={null}
        onGenerate={onGenerate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Get insights/i }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it("renders generated insights and the Gemini attribution", () => {
    render(
      <Insights
        insights={sample}
        loading={false}
        source="gemini"
        onGenerate={() => {}}
      />,
    );
    expect(screen.getByText("Transport tip")).toBeInTheDocument();
    expect(screen.getByText("Diet tip")).toBeInTheDocument();
    expect(
      screen.getByText(/Generated with Google Gemini/i),
    ).toBeInTheDocument();
  });

  it("disables the button while loading", () => {
    render(
      <Insights
        insights={[]}
        loading={true}
        source={null}
        onGenerate={() => {}}
      />,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Insights
        insights={sample}
        loading={false}
        source="gemini"
        onGenerate={() => {}}
      />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
