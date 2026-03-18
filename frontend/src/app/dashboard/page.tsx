"use client";

import React, { useState } from "react";
import { Card, Title, Text, LineChart, DonutChart, Metric } from "@tremor/react";
import { Play, Square, Zap, Circle, ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useAttackContext } from "@/lib/AttackContext";
import { DiagnosisReportModal } from "@/components/DiagnosisReport";

export default function Dashboard() {
  // ── Global attack state from context ──────────────────────────────────────
  const { isRunning, isConnected, diagnosisReport, clearDiagnosis, startAttack, stopAttack, logs } =
    useAttackContext();

  // ── Local config state ────────────────────────────────────────────────────
  const [targetUrl, setTargetUrl] = useState("https://jsonplaceholder.typicode.com/posts");
  const [concurrentUsers, setConcurrentUsers] = useState(20);
  const [duration, setDuration] = useState(30);
  const [strategyType, setStrategyType] = useState("spikeStrategy");
  const [showReport, setShowReport] = useState(false);

  // Show modal as soon as a diagnosis arrives
  React.useEffect(() => {
    if (diagnosisReport) setShowReport(true);
  }, [diagnosisReport]);

  // ── Derive real-time chart data from SSE logs ─────────────────────────────
  const chartData = React.useMemo(() => {
    const points: { time: string; Latency: number }[] = [];
    for (const log of logs) {
      const m = log.match(/Latency:\s*(\d+)ms/);
      if (m) {
        const lat = parseInt(m[1]);
        const now = new Date();
        points.push({
          time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
          Latency: lat,
        });
      }
    }
    return points.slice(-30); // keep latest 30 data points
  }, [logs]);

  const successCount = logs.filter((l) => l.includes("OK] Latency:")).length;
  const errorCount = logs.filter((l) => l.includes("[ERROR") && !l.includes("[SYSTEM]")).length;
  const totalCount = successCount + errorCount;
  const avgLatency =
    chartData.length > 0
      ? Math.round(chartData.reduce((s, d) => s + d.Latency, 0) / chartData.length)
      : 0;
  const p95Latency =
    chartData.length > 0
      ? [...chartData].sort((a, b) => a.Latency - b.Latency)[
          Math.floor(chartData.length * 0.95)
        ]?.Latency ?? 0
      : 0;
  const errorRate = totalCount > 0 ? Math.round((errorCount / totalCount) * 100) : 0;

  const donutData = [
    { name: "Success", value: successCount || 1 },
    { name: "Error/Timeout", value: errorCount },
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStart = async () => {
    await startAttack({ targetUrl, concurrentUsers, durationSeconds: duration, strategyType });
  };

  const handleStop = async () => {
    await stopAttack();
  };

  return (
    <>
      {/* ── Diagnosis Report Modal ── */}
      {showReport && diagnosisReport && (
        <DiagnosisReportModal
          report={diagnosisReport}
          onClose={() => {
            setShowReport(false);
            clearDiagnosis();
          }}
        />
      )}

      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mt-8">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Mission Control</h1>
            <p className="text-slate-400 mt-1">
              Configure, launch, and monitor high-concurrency API health attacks.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#0b1229] border border-[#1e293b] px-4 py-2 rounded-full">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className={`text-sm font-medium ${isConnected ? "text-emerald-400" : "text-red-400"}`}>
              {isConnected ? "Backend Connected" : "Backend Offline"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card decoration="top" decorationColor="blue" className="bg-[#0b1229] border-[#1e293b]">
            <Text>Avg Latency</Text>
            <Metric className="text-white">{avgLatency} ms</Metric>
          </Card>
          <Card decoration="top" decorationColor="emerald" className="bg-[#0b1229] border-[#1e293b]">
            <Text>P95 Latency</Text>
            <Metric className="text-white">{p95Latency} ms</Metric>
          </Card>
          <Card decoration="top" decorationColor="red" className="bg-[#0b1229] border-[#1e293b]">
            <Text>Error Rate</Text>
            <Metric className="text-white">{errorRate} %</Metric>
          </Card>
          <Card decoration="top" decorationColor="amber" className="bg-[#0b1229] border-[#1e293b]">
            <Text>Status</Text>
            <div className="mt-4 flex items-center h-6">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isRunning
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                }`}
              >
                {isRunning ? (
                  <>
                    <Zap className="w-3.5 h-3.5" /> Running
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5" /> Idle
                  </>
                )}
              </span>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#0b1229] border-[#1e293b]">
            <Title className="text-white">Real-Time Latency (ms)</Title>
            <LineChart
              className="h-72 mt-4"
              data={chartData}
              index="time"
              categories={["Latency"]}
              colors={["blue"]}
              valueFormatter={(n: number) => `${n} ms`}
              showAnimation={true}
              showLegend={false}
              noDataText="Waiting for attack data..."
            />
          </Card>

          <Card className="bg-[#0b1229] border-[#1e293b]">
            <Title className="text-white">Request Breakdown</Title>
            <div className="flex justify-center items-center h-52 mt-4">
              <DonutChart
                className="h-full"
                data={donutData}
                category="value"
                index="name"
                valueFormatter={(n: number) => `${n}`}
                colors={["emerald", "red"]}
                showAnimation={true}
              />
            </div>
            <div className="flex justify-center gap-8 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /> {successCount} Success
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-400" /> {errorCount} Errors
              </div>
            </div>
          </Card>
        </div>

        {/* Attack Configuration */}
        <Card className="bg-[#0b1229] border-[#1e293b]">
          <Title className="text-white mb-4">Attack Configuration</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-2">
              <Text className="mb-2">Target API URL</Text>
              <input
                type="text"
                title="Target API URL"
                placeholder="https://your-api.com/endpoint"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                disabled={isRunning}
                className="w-full bg-[#1e293b] border border-slate-700 text-white text-sm rounded-md p-3 outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <Text className="mb-2">Concurrent Users</Text>
              <input
                type="number"
                title="Concurrent Users"
                min={1}
                max={500}
                value={concurrentUsers}
                onChange={(e) => setConcurrentUsers(Number(e.target.value))}
                disabled={isRunning}
                className="w-full bg-[#1e293b] border border-slate-700 text-white text-sm rounded-md p-3 outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <Text className="mb-2">Duration (s)</Text>
              <input
                type="number"
                title="Duration"
                min={5}
                max={300}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={isRunning}
                className="w-full bg-[#1e293b] border border-slate-700 text-white text-sm rounded-md p-3 outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Strategy selector */}
          <div className="mb-6">
            <Text className="mb-2">Attack Strategy</Text>
            <div className="flex gap-3">
              {[
                { id: "spikeStrategy", label: <div className="flex items-center gap-1.5 justify-center"><Zap className="w-4 h-4" /> Spike</div>, desc: "Instant full load" },
                { id: "rampUpStrategy", label: <div className="flex items-center gap-1.5 justify-center"><TrendingUp className="w-4 h-4" /> Ramp-Up</div>, desc: "Gradual scale-up" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStrategyType(s.id)}
                  disabled={isRunning}
                  className={`flex-1 py-3 px-4 rounded-md border text-sm transition-all disabled:cursor-not-allowed ${
                    strategyType === s.id
                      ? "bg-blue-600/20 border-blue-500 text-blue-300"
                      : "bg-[#1e293b] border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: isRunning ? 1 : 1.02 }}
              whileTap={{ scale: isRunning ? 1 : 0.98 }}
              onClick={handleStart}
              disabled={isRunning}
              className={`flex-1 py-3 rounded-md font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
                isRunning
                  ? "bg-blue-900/50 text-blue-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              }`}
            >
              <Play className="w-5 h-5" />
              {isRunning ? "Attack in Progress..." : "INITIALIZE ATTACK"}
            </motion.button>

            <motion.button
              whileHover={{ scale: !isRunning ? 1 : 1.02 }}
              whileTap={{ scale: !isRunning ? 1 : 0.98 }}
              onClick={handleStop}
              disabled={!isRunning}
              className={`flex-1 py-3 rounded-md font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
                !isRunning
                  ? "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(245,101,101,0.4)]"
              }`}
            >
              <Square className="w-5 h-5" />
              ABORT ATTACK
            </motion.button>
          </div>
        </Card>

        {/* Latest report preview (if available and not shown in modal) */}
        {diagnosisReport && !showReport && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`cursor-pointer rounded-xl border p-4 flex items-center justify-between ${
              diagnosisReport.status === "PASSED"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
            onClick={() => setShowReport(true)}
          >
            <div>
              <p className={`font-bold text-sm ${diagnosisReport.status === "PASSED" ? "text-emerald-300" : "text-red-300"}`}>
                Last Report: {diagnosisReport.status}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {diagnosisReport.totalRequests.toLocaleString()} requests — {diagnosisReport.errorRatePercentage.toFixed(1)}% errors — Avg {diagnosisReport.averageLatencyMs.toFixed(0)}ms
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 underline hover:text-white transition-colors">
              View Full Report <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}