import { useEffect, useRef, useState } from "react";

export interface VirtualListRange {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

interface Options {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

export function useVirtualList({ itemCount, itemHeight, overscan = 6 }: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setViewportHeight(el.clientHeight);
    setScrollTop(el.scrollTop);

    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = new ResizeObserver(() => {
      setViewportHeight(el.clientHeight);
      setScrollTop(el.scrollTop);
    });
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  const totalHeight = itemCount * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(Math.max(0, itemCount - 1), startIndex + visibleCount);
  const offsetY = startIndex * itemHeight;

  const range: VirtualListRange = {
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
  };

  return { containerRef, range, itemHeight };
}
