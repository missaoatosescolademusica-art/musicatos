"use client"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

export type Presence = "online" | "away" | "offline"

type StatusEntry = { timestamp: number; status: Presence }

type StatusState = {
  statuses: Record<string, Presence>;
  history: Record<string, StatusEntry[]>;
  register: (id: string) => void;
  unregister: (id: string) => void;
  markActive: (id: string) => void;
};

const StatusContext = createContext<StatusState | undefined>(undefined);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, Presence>>({});
  const [history, setHistory] = useState<Record<string, StatusEntry[]>>({});
  const tracked = useRef<Set<string>>(new Set());
  const lastActiveAt = useRef<Record<string, number>>({});
  const timer = useRef<number | null>(null);
  const idleMs = 2 * 60 * 1000;

  const poll = async () => {
    const ids = Array.from(tracked.current);
    if (ids.length === 0) return;
    try {
      const url = `/api/user/status?ids=${encodeURIComponent(ids.join(","))}`;
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.statuses) return;
      const next: Record<string, Presence> = { ...statuses };
      const nextHist: Record<string, StatusEntry[]> = { ...history };
      const now = Date.now();
      for (const s of json.statuses as Array<{
        id: string;
        status: Presence;
      }>) {
        const prev = next[s.id];
        next[s.id] = s.status;
        if (prev !== s.status) {
          const arr = nextHist[s.id] || [];
          nextHist[s.id] = [...arr, { timestamp: now, status: s.status }];
        }
      }
      setStatuses(next);
      setHistory(nextHist);
    } catch {}
  };

  useEffect(() => {
    if (timer.current != null) return;
    const t = window.setInterval(poll, 30000);
    timer.current = t as unknown as number;
    return () => {
      if (timer.current != null) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      const ids = Array.from(tracked.current);
      if (ids.length === 0) return;
      const now = Date.now();
      const next = { ...statuses };
      const nextHist = { ...history };
      let changed = false;
      for (const id of ids) {
        const last = lastActiveAt.current[id] || 0;
        if (now - last > idleMs && next[id] !== "away") {
          next[id] = "away";
          const arr = nextHist[id] || [];
          nextHist[id] = [...arr, { timestamp: now, status: "away" }];
          changed = true;
          try {
            fetch("/api/user/activity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "away", timestamp: now }),
            }).catch(() => {});
          } catch {}
        }
      }
      if (changed) {
        setStatuses(next);
        setHistory(nextHist);
      }
    }, 15000);
    return () => {
      clearInterval(t);
    };
  }, [statuses, history]);

  const register = (id: string) => {
    tracked.current.add(id);
    poll();
  };
  const unregister = (id: string) => {
    tracked.current.delete(id);
  };
  const markActive = (id: string) => {
    if (!id) return;
    const now = Date.now();
    const prev = statuses[id];
    if (prev !== "online" || now - (lastActiveAt.current[id] || 0) > 3000) {
      lastActiveAt.current[id] = now;
      const next = { ...statuses, [id]: "online" as Presence };
      setStatuses(next);
      const arr = history[id] || [];
      setHistory({
        ...history,
        [id]: [...arr, { timestamp: now, status: "online" }],
      });
      try {
        fetch("/api/user/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "online", timestamp: now }),
        }).catch(() => {});
      } catch {}
    }
  };

  const value = useMemo(
    () => ({ statuses, history, register, unregister, markActive }),
    [statuses, history]
  );
  return (
    <StatusContext.Provider value={value}>{children}</StatusContext.Provider>
  );
}

export function useStatus(userId: string | undefined) {
  const ctx = useContext(StatusContext);
  if (!ctx)
    return {
      status: undefined as Presence | undefined,
      history: [] as StatusEntry[],
      register: () => {},
      unregister: () => {},
      markActive: (_: string) => {},
    };
  const status = userId ? ctx.statuses[userId] : undefined;
  const hist = userId ? ctx.history[userId] || [] : [];
  return {
    status,
    history: hist,
    register: ctx.register,
    unregister: ctx.unregister,
    markActive: ctx.markActive,
  };
}
