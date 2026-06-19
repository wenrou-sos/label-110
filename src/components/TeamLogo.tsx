import type { Team } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  team: Team;
  size?: number;
  className?: string;
}

export function TeamLogo({ team, size = 36, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-display font-600 uppercase tracking-tight select-none shrink-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, ${team.color}EE, ${team.color}AA 55%, ${team.color}55 100%)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18), 0 6px 16px -8px ${team.color}CC`,
        fontSize: Math.round(size * 0.33),
        color: "#070A12",
      }}
      aria-hidden="true"
    >
      {team.short.slice(0, 3)}
    </span>
  );
}
