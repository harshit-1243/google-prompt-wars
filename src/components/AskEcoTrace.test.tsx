// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import AskEcoTrace from "./AskEcoTrace";
import { DEFAULT_INPUT } from "@/lib/emissions";
import { a11yViolations } from "@/test/axe";

afterEach(cleanup);

describe("AskEcoTrace", () => {
  it("exposes an accessible question field", () => {
    render(<AskEcoTrace input={DEFAULT_INPUT} />);
    expect(
      screen.getByRole("textbox", { name: /climate question/i }),
    ).toBeInTheDocument();
  });

  it("disables the Ask button until a question is typed", () => {
    render(<AskEcoTrace input={DEFAULT_INPUT} />);
    const button = screen.getByRole("button", { name: /^Ask$/i });
    expect(button).toBeDisabled();
    fireEvent.change(
      screen.getByRole("textbox", { name: /climate question/i }),
      { target: { value: "Why does flying matter?" } },
    );
    expect(button).toBeEnabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<AskEcoTrace input={DEFAULT_INPUT} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
