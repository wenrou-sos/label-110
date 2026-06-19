import { useEffect, useRef } from "react";
import { generateMatches } from "@/data/seed";
import { createMockSocket, type MockWebSocket } from "@/services/mockSocket";
import { useOddsStore } from "@/store/useOddsStore";
import type { ServerMessage } from "@/types";

const SEED = generateMatches();
const MAX_BACKOFF = 30000;

export function useOddsStream(): void {
  const socketRef = useRef<MockWebSocket | null>(null);
  const attemptRef = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    const store = useOddsStore.getState();

    const handleMessage = (ev: { data: string }) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(ev.data) as ServerMessage;
      } catch {
        return;
      }
      switch (msg.type) {
        case "snapshot":
          store.setSnapshot(msg.matches, msg.serverTime);
          break;
        case "odds_update":
          store.applyOddsUpdate(msg.matchId, msg.market, msg.selection, msg.odds, msg.timestamp);
          break;
        case "distribution":
          store.applyDistribution(msg.matchId, msg.distribution);
          break;
        case "status":
          store.applyStatus(msg.matchId, msg.status, msg.score);
          break;
        default:
          break;
      }
    };

    const connect = () => {
      if (disposedRef.current) return;
      store.setConnState(attemptRef.current === 0 ? "connecting" : "reconnecting");
      const socket = createMockSocket(SEED);
      socketRef.current = socket;
      socket.onmessage = handleMessage;
      socket.onclose = () => {
        if (disposedRef.current) return;
        if (socketRef.current !== socket) return;
        store.setConnState("reconnecting");
        attemptRef.current += 1;
        store.setReconnectAttempt(attemptRef.current);
        const delay = Math.min(MAX_BACKOFF, 800 * 2 ** (attemptRef.current - 1));
        reconnectTimer.current = setTimeout(connect, delay);
      };
      socket.onerror = () => store.setConnState("error");
    };

    connect();

    const hotTimer = setInterval(() => store.tickHot(Date.now()), 5000);

    return () => {
      disposedRef.current = true;
      clearInterval(hotTimer);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);
}
