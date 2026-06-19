import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DistributionBar } from "@/components/DistributionBar";

describe("DistributionBar", () => {
  it("renders three segments with percentages for football", () => {
    render(
      <DistributionBar
        distribution={{ home: 0.5, draw: 0.2, away: 0.3 }}
        sport="football"
      />,
    );
    expect(screen.getByText("主胜")).toBeInTheDocument();
    expect(screen.getByText("平局")).toBeInTheDocument();
    expect(screen.getByText("客胜")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("hides the draw segment for tennis", () => {
    render(
      <DistributionBar
        distribution={{ home: 0.6, draw: 0, away: 0.4 }}
        sport="tennis"
      />,
    );
    expect(screen.getByText("主胜")).toBeInTheDocument();
    expect(screen.getByText("客胜")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
