import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Filters } from "@/components/FilterBar";
import { FilterBar } from "@/components/FilterBar";
import { makeMatch } from "@/test/fixtures";

const baseFilters: Filters = {
  date: "today",
  sports: [],
  search: "",
  onlyHot: false,
  onlyAnomaly: false,
  onlyFavorites: false,
  league: null,
};

function getLeagueTabLabels() {
  const container = screen.getByTestId("league-tabs");
  return Array.from(container.querySelectorAll("button")).map((b) => {
    const text = b.textContent ?? "";
    return text.replace(/\d+$/g, "").trim();
  });
}

describe("FilterBar league tabs", () => {
  it("does not show league tabs when no sport selected", () => {
    const matches = [
      makeMatch({ id: "a", sport: "football", leagueShort: "EPL" }),
      makeMatch({ id: "b", sport: "football", leagueShort: "LALIGA" }),
    ];
    render(
      <FilterBar
        filters={baseFilters}
        onChange={() => {}}
        todayCount={2}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    expect(screen.queryByText("全部")).not.toBeInTheDocument();
    expect(screen.queryByText("英超")).not.toBeInTheDocument();
  });

  it("does not show league tabs when multiple sports selected", () => {
    const matches = [
      makeMatch({ id: "a", sport: "football", leagueShort: "EPL" }),
      makeMatch({ id: "b", sport: "basketball", leagueShort: "NBA" }),
    ];
    render(
      <FilterBar
        filters={{ ...baseFilters, sports: ["football", "basketball"] }}
        onChange={() => {}}
        todayCount={2}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    expect(screen.queryByText("全部")).not.toBeInTheDocument();
    expect(screen.queryByText("英超")).not.toBeInTheDocument();
    expect(screen.queryByText("NBA")).not.toBeInTheDocument();
  });

  it("shows league tabs when exactly one sport is selected", () => {
    const matches = [
      makeMatch({ id: "a", sport: "football", leagueShort: "EPL" }),
      makeMatch({ id: "b", sport: "football", leagueShort: "LALIGA" }),
      makeMatch({ id: "c", sport: "football", leagueShort: "SERIEA" }),
      makeMatch({ id: "d", sport: "basketball", leagueShort: "NBA" }),
    ];
    render(
      <FilterBar
        filters={{ ...baseFilters, sports: ["football"] }}
        onChange={() => {}}
        todayCount={4}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    expect(screen.getByText("全部")).toBeInTheDocument();
    expect(screen.getByText("英超")).toBeInTheDocument();
    expect(screen.getByText("西甲")).toBeInTheDocument();
    expect(screen.getByText("意甲")).toBeInTheDocument();
    expect(screen.queryByText("NBA")).not.toBeInTheDocument();
  });

  it("extracts unique leagues from data and sorts them alphabetically by short name", () => {
    const matches = [
      makeMatch({ id: "a", sport: "football", leagueShort: "SERIEA" }),
      makeMatch({ id: "b", sport: "football", leagueShort: "EPL" }),
      makeMatch({ id: "c", sport: "football", leagueShort: "LALIGA" }),
      makeMatch({ id: "d", sport: "football", leagueShort: "EPL" }),
    ];
    render(
      <FilterBar
        filters={{ ...baseFilters, sports: ["football"] }}
        onChange={() => {}}
        todayCount={4}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    expect(getLeagueTabLabels()).toEqual(["全部", "英超", "西甲", "意甲"]);
  });

  it("shows correct counts on league tabs", () => {
    const matches = [
      makeMatch({ id: "a", sport: "football", leagueShort: "EPL" }),
      makeMatch({ id: "b", sport: "football", leagueShort: "EPL" }),
      makeMatch({ id: "c", sport: "football", leagueShort: "LALIGA" }),
    ];
    render(
      <FilterBar
        filters={{ ...baseFilters, sports: ["football"] }}
        onChange={() => {}}
        todayCount={3}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    const allButtonTexts = screen.getAllByRole("button").map((b) => b.textContent?.trim());
    expect(allButtonTexts).toContain("全部3");
    expect(allButtonTexts).toContain("英超2");
    expect(allButtonTexts).toContain("西甲1");
  });

  it("calls onChange with the selected league when a league tab is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const matches = [
      makeMatch({ id: "a", sport: "football", leagueShort: "EPL" }),
      makeMatch({ id: "b", sport: "football", leagueShort: "LALIGA" }),
    ];
    render(
      <FilterBar
        filters={{ ...baseFilters, sports: ["football"] }}
        onChange={onChange}
        todayCount={2}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    await user.click(screen.getByText("英超"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ league: "EPL" }));
  });

  it("calls onChange with league: null when '全部' is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const matches = [makeMatch({ id: "a", sport: "football", leagueShort: "EPL" })];
    render(
      <FilterBar
        filters={{ ...baseFilters, sports: ["football"], league: "EPL" }}
        onChange={onChange}
        todayCount={1}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    await user.click(screen.getByText("全部"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ league: null }));
  });

  it("resets league selection when switching to a different sport where it doesn't exist", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const matches = [
      makeMatch({ id: "a", sport: "football", leagueShort: "EPL" }),
      makeMatch({ id: "b", sport: "basketball", leagueShort: "NBA" }),
    ];
    render(
      <FilterBar
        filters={{ ...baseFilters, sports: ["football"], league: "EPL" }}
        onChange={onChange}
        todayCount={2}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /篮球/ }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      sports: ["football", "basketball"],
      league: null,
    }));
  });

  it("preserves league selection when it exists in the new single sport", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const matches = [makeMatch({ id: "a", sport: "football", leagueShort: "EPL" })];
    render(
      <FilterBar
        filters={{ ...baseFilters, sports: [], league: "EPL" }}
        onChange={onChange}
        todayCount={1}
        tomorrowCount={0}
        favoritesCount={0}
        matches={matches}
        favorites={new Set()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /足球/ }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      sports: ["football"],
      league: "EPL",
    }));
  });
});
