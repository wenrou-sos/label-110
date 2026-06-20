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
  const prevCountRef = useRef(itemCount);
  const prevHeightRef = useRef(itemHeight);

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

  useEffect(() => {
    const countChanged = itemCount !== prevCountRef.current;
    const heightChanged = itemHeight !== prevHeightRef.current;
    prevCountRef.current = itemCount;
    prevHeightRef.current = itemHeight;

    const el = containerRef.current;
    const totalHeight = itemCount * itemHeight;

    if (countChanged || heightChanged) {
      if (el) {
        const clamped = Math.min(el.scrollTop, Math.max(0, totalHeight - viewportHeight));
        if (clamped !== el.scrollTop) {
          el.scrollTop = clamped;
        }
        setViewportHeight(el.clientHeight);
        setScrollTop(el.scrollTop);
      }
    }
  }, [itemCount, itemHeight, viewportHeight]);

  const totalHeight = itemCount * itemHeight;
  const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
  const safeScrollTop = Math.min(scrollTop, maxScrollTop);
  const startIndex = Math.max(0, Math.floor(safeScrollTop / itemHeight) - overscan);
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
