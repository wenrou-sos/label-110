import { useMemo } from "react";
import type { OddsHistoryPoint } from "@/types";

interface Props {
  data: OddsHistoryPoint[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "#F5B614",
  fill = "rgba(245, 182, 20, 0.15)",
  strokeWidth = 1.5,
}: Props) {
  const pathData = useMemo(() => {
    if (data.length < 2) return { line: "", area: "" };

    const minT = data[0].t;
    const maxT = data[data.length - 1].t;
    const values = data.map((d) => d.odds);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const padY = 2;

    const xScale = (t: number) => {
      if (maxT === minT) return width;
      return ((t - minT) / (maxT - minT)) * width;
    };
    const yScale = (v: number) => height - padY - ((v - minV) / range) * (height - padY * 2);

    let linePath = "";
    let areaPath = "";

    for (let i = 0; i < data.length; i++) {
      const x = xScale(data[i].t);
      const y = yScale(data[i].odds);
      if (i === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${height} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    }
    areaPath += ` L ${width} ${height} Z`;

    return { line: linePath, area: areaPath };
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="赔率走势图（数据不足）"
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="赔率走势折线图"
      className="overflow-visible"
    >
      <path d={pathData.area} fill={fill} />
      <path
        d={pathData.line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
