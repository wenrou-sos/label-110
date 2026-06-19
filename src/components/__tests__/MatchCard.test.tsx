import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/MatchCard";
import { useOddsStore } from "@/store/useOddsStore";
import { makeMatch } from "@/test/fixtures";

beforeEach(() => {
  useOddsStore.getState().reset();
});

describe("MatchCard", () => {
  it("renders teams, league and odds", () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText("主队A")).toBeInTheDocument();
    expect(screen.getByText("客队B")).toBeInTheDocument();
    expect(screen.getAllByText("主胜").length).toBeGreaterThan(0);
    expect(screen.getByText("EPL")).toBeInTheDocument();
  });

  it("shows the hot badge when the match is hot", () => {
    render(<MatchCard match={makeMatch({ isHot: true })} />);
    expect(screen.getByText("火热")).toBeInTheDocument();
  });

  it("shows the LIVE badge for live matches", () => {
    render(
      <MatchCard match={makeMatch({ status: "live", score: { home: 1, away: 0 } })} />,
    );
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders odds values", () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText("2.00")).toBeInTheDocument();
  });
});
