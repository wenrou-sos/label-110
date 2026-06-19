import { Activity, AlertTriangle, CalendarDays, Wifi, WifiOff } from "lucide-react";
import { useOddsStore } from "@/store/useOddsStore";
import { useClock } from "@/hooks/useClock";
import { formatClock } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { ConnState } from "@/types";

const CONN_META: Record<ConnState, { label: string; color: string; dot: string; pulse?: boolean }> = {
  connecting: { label: "连接中", color: "text-amber", dot: "bg-amber", pulse: true },
  open: { label: "已连接", color: "text-hot-up", dot: "bg-hot-up" },
  reconnecting: { label: "重连中", color: "text-amber", dot: "bg-amber", pulse: true },
  closed: { label: "已断开", color: "text-hot-down", dot: "bg-hot-down" },
  error: { label: "连接异常", color: "text-hot-anomaly", dot: "bg-hot-anomaly", pulse: true },
};

export function StatusBar() {
  const connState = useOddsStore((s) => s.connState);
  const matchCount = useOddsStore((s) => s.matches.length);
  const anomalyCount = useOddsStore((s) => s.anomalies.length);
  const attempt = useOddsStore((s) => s.reconnectAttempt);
  const now = useClock(1000);
  const conn = CONN_META[connState];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-night/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber to-amber-glow text-night shadow-glowAmber">
            <Activity size={18} strokeWidth={2.6} />
          </span>
          <div className="leading-tight">
            <h1 className="font-display text-[15px] font-700 uppercase tracking-wide text-ink">
              赔率指挥中心
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
              Live Odds Command
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Stat icon={<CalendarDays size={13} />} label="在线赛事" value={matchCount} />
          <Stat
            icon={<AlertTriangle size={13} />}
            label="异常波动"
            value={anomalyCount}
            tone={anomalyCount > 0 ? "danger" : "default"}
          />

          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5",
              conn.color,
              "border-line bg-raised",
            )}
            role="status"
            aria-label={`连接状态：${conn.label}`}
          >
            {connState === "closed" || connState === "error" ? (
              <WifiOff size={13} />
            ) : (
              <Wifi size={13} />
            )}
            <span
              className={cn("h-1.5 w-1.5 rounded-full", conn.dot, conn.pulse && "animate-dot-pulse")}
            />
            <span className="font-display text-[11px] font-600 uppercase tracking-wide">
              {conn.label}
            </span>
            {attempt > 0 && connState === "reconnecting" && (
              <span className="font-mono text-[9px] text-ink-faint">#{attempt}</span>
            )}
          </div>

          <div className="hidden items-center gap-1 rounded-md border border-line bg-raised px-2.5 py-1.5 sm:flex">
            <span className="font-mono text-[13px] font-600 tabular-nums text-cyan">
              {formatClock(now)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="hidden items-center gap-1.5 rounded-md border border-line bg-raised px-2.5 py-1.5 md:flex">
      <span className={tone === "danger" && value > 0 ? "text-hot-anomaly" : "text-ink-muted"}>
        {icon}
      </span>
      <span className="font-display text-[10px] font-600 uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[13px] font-700 tabular-nums",
          tone === "danger" && value > 0 ? "text-hot-anomaly" : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}
