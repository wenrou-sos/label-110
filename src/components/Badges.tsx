import { AlertTriangle, Flame, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export function HotBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "chip text-amber border border-amber/40 bg-amber/10 shadow-glowAmber",
        className,
      )}
      title="热门赛事"
    >
      <Flame size={12} className="animate-dot-pulse" />
      火热
    </span>
  );
}

export function AnomalyBadge({
  dropPct,
  className,
}: {
  dropPct?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "chip text-hot-anomaly border border-hot-anomaly/50 bg-hot-anomaly/10 animate-pulse-anomaly",
        className,
      )}
      title="异常波动：5分钟内跌幅超过20%"
    >
      <AlertTriangle size={12} />
      异常波动{dropPct ? ` · ${Math.round(dropPct * 100)}%` : ""}
    </span>
  );
}

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "chip text-hot-up border border-hot-up/40 bg-hot-up/10",
        className,
      )}
      title="赛事进行中"
    >
      <Radio size={12} className="animate-dot-pulse" />
      LIVE
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: "scheduled" | "live" | "finished";
  className?: string;
}) {
  if (status === "live") return <LiveBadge className={className} />;
  const label = status === "scheduled" ? "未开赛" : "已结束";
  return (
    <span
      className={cn(
        "chip text-ink-faint border border-line bg-raised",
        className,
      )}
    >
      {label}
    </span>
  );
}
