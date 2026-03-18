"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DiagnosisReport {
  status: "PASSED" | "FAILED" | "DEGRADED";
  targetUrl: string;
  strategy: string;
  concurrentUsers: number;
  durationSeconds: number;
  totalRequests: number;
  totalErrors: number;
  errorRatePercentage: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  firstFailureType: string;
  autoKilled: boolean;
}

export interface AttackConfig {
  targetUrl: string;
  concurrentUsers: number;
  durationSeconds: number;
  strategyType: string;
}

interface AttackContextValue {
  logs: string[];
  isConnected: boolean;
  isRunning: boolean;
  diagnosisReport: DiagnosisReport | null;
  clearDiagnosis: () => void;
  startAttack: (config: AttackConfig) => Promise<void>;
  stopAttack: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AttackContext = createContext<AttackContextValue | null>(null);

export function useAttackContext(): AttackContextValue {
  const ctx = useContext(AttackContext);
  if (!ctx) throw new Error("useAttackContext must be used inside AttackProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * AttackProvider mounts a SINGLE persistent EventSource for the lifetime of
 * the dashboard layout. Page navigation never tears down this connection.
 *
 * Reconnect logic: exponential backoff capped at 30 s. The heartbeat event
 * that the backend sends every 15 s resets the idle timer.
 */
export function AttackProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] AeroLoad API Health Tester v2.0",
    "[SYSTEM] Establishing persistent SSE connection to Backend Executor...",
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosisReport, setDiagnosisReport] = useState<DiagnosisReport | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Append log helper (capped at 1000 lines) ──────────────────────────────
  const appendLog = useCallback((line: string) => {
    setLogs((prev) => {
      const next = [...prev, line];
      return next.length > 1000 ? next.slice(next.length - 1000) : next;
    });
  }, []);

  // ── Connect / reconnect ───────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource("http://localhost:8080/api/test/stream");
    esRef.current = es;

    es.addEventListener("heartbeat", () => {
      // Heartbeat arrived — we are definitely connected
      setIsConnected(true);
      reconnectDelay.current = 1000; // reset backoff on successful ping
    });

    es.addEventListener("message", (event: MessageEvent) => {
      setIsConnected(true);
      reconnectDelay.current = 1000;
      const data: string = event.data;
      appendLog(data);

      // Detect running state from log contents
      if (data.includes("[INFO] Starting") || data.includes("[INFO] Strategy:")) {
        setIsRunning(true);
      }
      if (data.includes("[DIAGNOSIS REPORT]") || data.includes("[SUCCESS]")) {
        setIsRunning(false);
      }
    });

    es.addEventListener("diagnosis", (event: MessageEvent) => {
      try {
        const report: DiagnosisReport = JSON.parse(event.data);
        setDiagnosisReport(report);
        setIsRunning(false);
      } catch (err) {
        console.error("[AttackContext] Failed to parse diagnosis event", err);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      esRef.current = null;

      // Exponential backoff: 1s → 2s → 4s → … → 30s
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(delay * 2, 30000);
      appendLog(`[WARN] SSE connection lost. Retrying in ${delay / 1000}s...`);

      reconnectTimer.current = setTimeout(connect, delay);
    };
  }, [appendLog]);

  // ── Mount / unmount the persistent SSE ────────────────────────────────────
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      esRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync running state from backend on mount ──────────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/test/status");
        if (res.ok) {
          const data = await res.json();
          setIsRunning(Boolean(data.isRunning));
        }
      } catch {
        /* backend not yet reachable — that's fine */
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Start attack ──────────────────────────────────────────────────────────
  const startAttack = useCallback(async (config: AttackConfig) => {
    setDiagnosisReport(null);
    setIsRunning(true);
    setLogs((prev) => [
      ...prev,
      `[INFO] Dispatching attack: ${config.strategyType} → ${config.targetUrl}`,
    ]);

    const payload = {
      name: "AeroLoad Attack",
      targetUrl: config.targetUrl,
      strategyType: config.strategyType,
      durationSeconds: config.durationSeconds,
      concurrentUsers: config.concurrentUsers,
      requestsPerSecond: config.concurrentUsers,
    };

    const res = await fetch("http://localhost:8080/api/test/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      appendLog("[ERROR] Failed to start attack — backend returned " + res.status);
      setIsRunning(false);
    }
  }, [appendLog]);

  // ── Stop attack ───────────────────────────────────────────────────────────
  const stopAttack = useCallback(async () => {
    try {
      await fetch("http://localhost:8080/api/test/stop", { method: "POST" });
      appendLog("[WARN] Manual abort signal sent.");
    } catch {
      appendLog("[ERROR] Failed to reach backend to send stop signal.");
    }
  }, [appendLog]);

  const clearDiagnosis = useCallback(() => setDiagnosisReport(null), []);

  return (
    <AttackContext.Provider
      value={{ logs, isConnected, isRunning, diagnosisReport, clearDiagnosis, startAttack, stopAttack }}
    >
      {children}
    </AttackContext.Provider>
  );
}
