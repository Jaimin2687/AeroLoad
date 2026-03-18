"use client";

import React, { useEffect, useRef } from "react";
import { TerminalSquare, Activity } from "lucide-react";
import { Card } from "@tremor/react";
import { useAttackContext } from "@/lib/AttackContext";

export default function TerminalPage() {
  const { logs, isConnected } = useAttackContext();
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest log
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogStyle = (log: string) => {
    if (log.includes("[ERROR") || log.includes("[FATAL")) return "text-red-400 font-bold";
    if (log.includes("[WARN]")) return "text-amber-400";
    if (log.includes("[INFO]")) return "text-blue-400";
    if (log.includes("OK] Latency:") || log.includes("[SUCCESS]")) return "text-emerald-400";
    if (log.includes("[DIAGNOSIS REPORT]")) return "text-white font-bold";
    if (log.includes("•")) return "text-slate-300";
    if (log.includes("===")) return "text-slate-500";
    return "text-slate-300";
  };

  return (
    <div className="h-full max-h-screen flex flex-col p-8 w-full max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
            <TerminalSquare className="w-8 h-8 text-blue-500" />
            Live Execution Terminal
          </h1>
          <p className="text-slate-400 mt-1">
            A real-time SSE stream from the core Java thread pool. Stream persists across page navigation.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0b1229] border border-[#1e293b] px-4 py-2 rounded-full">
          <Activity
            className={`w-4 h-4 ${isConnected ? "text-emerald-500 animate-pulse" : "text-red-500"}`}
          />
          <span className={`text-sm font-medium ${isConnected ? "text-emerald-500" : "text-red-500"}`}>
            {isConnected ? "STREAM ACTIVE" : "RECONNECTING..."}
          </span>
        </div>
      </div>

      <Card className="flex-1 bg-black border-[#1e293b] p-0 overflow-hidden flex flex-col shadow-2xl relative shadow-blue-900/10">
        {/* Terminal title bar */}
        <div className="bg-[#0b1229] border-b border-[#1e293b] p-3 flex gap-2 items-center">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-4 text-slate-500 font-mono text-xs">
            root@aeroload-engine:/var/log/metrics/live_tail — {logs.length} lines
          </span>
        </div>

        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed space-y-1"
        >
          {logs.map((log, index) => (
            <div key={index} className="flex gap-4">
              <span className="text-slate-600 select-none w-10 text-right shrink-0">
                {index + 1}
              </span>
              <span className={`flex-1 break-all ${getLogStyle(log)}`}>{log}</span>
            </div>
          ))}

          {isConnected && (
            <div className="flex gap-4 mt-2">
              <span className="text-slate-600 w-10 text-right shrink-0">~</span>
              <span className="text-white bg-white/20 w-2.5 h-5 inline-block animate-pulse align-middle" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}