"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Zap,
  Clock,
  Activity,
  Users,
  BarChart3,
  AlertOctagon,
  ArrowRight,
} from "lucide-react";
import type { DiagnosisReport } from "@/lib/AttackContext";

interface Props {
  report: DiagnosisReport;
  onClose: () => void;
}

// ── Thresholds for colour-coding ─────────────────────────────────────────────
const ERROR_RATE_WARN = 1;  // %
const ERROR_RATE_FAIL = 5;  // %
const AVG_LAT_WARN = 500;   // ms
const AVG_LAT_FAIL = 1000;  // ms
const P95_LAT_WARN = 800;   // ms
const P95_LAT_FAIL = 2000;  // ms

function metricColor(value: number, warn: number, fail: number): string {
  if (value >= fail) return "text-red-400";
  if (value >= warn) return "text-amber-400";
  return "text-emerald-400";
}

function metricIcon(value: number, warn: number, fail: number) {
  if (value >= fail)
    return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
  if (value >= warn)
    return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
  return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
}

const statusConfig = {
  PASSED: {
    label: "ALL SYSTEMS HEALTHY",
    icon: CheckCircle,
    glow: "shadow-[0_0_60px_rgba(52,211,153,0.25)]",
    border: "border-emerald-500/40",
    badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
    dot: "bg-emerald-400",
  },
  DEGRADED: {
    label: "DEGRADED PERFORMANCE",
    icon: AlertTriangle,
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.25)]",
    border: "border-amber-500/40",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    dot: "bg-amber-400",
  },
  FAILED: {
    label: "CRITICAL FAILURES DETECTED",
    icon: AlertOctagon,
    glow: "shadow-[0_0_60px_rgba(248,113,113,0.25)]",
    border: "border-red-500/40",
    badge: "bg-red-500/20 text-red-300 border border-red-500/40",
    dot: "bg-red-400",
  },
};

export function DiagnosisReportModal({ report, onClose }: Props) {
  const cfg = statusConfig[report.status] ?? statusConfig.FAILED;
  const StatusIcon = cfg.icon;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Panel */}
        <motion.div
          key="panel"
          className={`relative w-full max-w-2xl bg-[#0b1229] border ${cfg.border} rounded-2xl p-8 ${cfg.glow} overflow-y-auto max-h-[90vh]`}
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`p-3 rounded-xl ${cfg.badge}`}>
              <StatusIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-mono mb-1">DIAGNOSIS REPORT</p>
              <h2 className="text-2xl font-bold text-white tracking-tight">{cfg.label}</h2>
              <p className="text-slate-400 text-sm mt-1 break-all">{report.targetUrl}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mb-8">
            <span className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-full">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              {report.strategy}
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              {report.concurrentUsers} users
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {report.durationSeconds}s duration
            </span>
            {report.autoKilled && (
              <span className="flex items-center gap-1.5 text-xs bg-red-500/20 border border-red-500/40 text-red-300 px-3 py-1.5 rounded-full">
                <AlertOctagon className="w-3.5 h-3.5" />
                AUTO-KILLED
              </span>
            )}
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Total Requests */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Total Requests</span>
              </div>
              <p className="text-3xl font-bold text-white">{report.totalRequests.toLocaleString()}</p>
            </div>

            {/* Total Errors */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Total Errors</span>
              </div>
              <p className={`text-3xl font-bold ${report.totalErrors > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {report.totalErrors.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Metric rows with pass/fail indicators */}
          <div className="space-y-3 mb-6">
            {/* Error Rate */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                {metricIcon(report.errorRatePercentage, ERROR_RATE_WARN, ERROR_RATE_FAIL)}
                <div>
                  <p className="text-sm text-white font-medium">Error Rate</p>
                  <p className="text-xs text-slate-500">Threshold: &lt;{ERROR_RATE_FAIL}%</p>
                </div>
              </div>
              <span className={`text-lg font-bold font-mono ${metricColor(report.errorRatePercentage, ERROR_RATE_WARN, ERROR_RATE_FAIL)}`}>
                {report.errorRatePercentage.toFixed(1)}%
              </span>
            </div>

            {/* Avg Latency */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                {metricIcon(report.averageLatencyMs, AVG_LAT_WARN, AVG_LAT_FAIL)}
                <div>
                  <p className="text-sm text-white font-medium">Average Latency</p>
                  <p className="text-xs text-slate-500">Threshold: &lt;{AVG_LAT_FAIL}ms</p>
                </div>
              </div>
              <span className={`text-lg font-bold font-mono ${metricColor(report.averageLatencyMs, AVG_LAT_WARN, AVG_LAT_FAIL)}`}>
                {report.averageLatencyMs.toFixed(0)}ms
              </span>
            </div>

            {/* P95 Latency */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                {metricIcon(report.p95LatencyMs, P95_LAT_WARN, P95_LAT_FAIL)}
                <div>
                  <p className="text-sm text-white font-medium">P95 Latency</p>
                  <p className="text-xs text-slate-500">95th percentile response time</p>
                </div>
              </div>
              <span className={`text-lg font-bold font-mono ${metricColor(report.p95LatencyMs, P95_LAT_WARN, P95_LAT_FAIL)}`}>
                {report.p95LatencyMs.toFixed(0)}ms
              </span>
            </div>
          </div>

          {/* Failure analysis (only shown when there's something to report) */}
          {report.firstFailureType !== "None" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-300">First Failure Detected</span>
              </div>
              <p className="text-sm text-red-200 font-mono">{report.firstFailureType}</p>
            </div>
          )}

          {/* Recommendations */}
          {report.status !== "PASSED" ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-amber-300 mb-3">Recommended Actions</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {report.autoKilled && (
                  <li className="flex gap-2">
                    <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    Implement circuit breakers on the target endpoint to prevent cascade failures.
                  </li>
                )}
                <li className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Check CPU and memory utilization on the target server during peak load.
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Review database connection pool size — pool exhaustion is the most common cause of 503s under load.
                </li>
                {report.p95LatencyMs > P95_LAT_WARN && (
                  <li className="flex gap-2">
                    <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    High P95 latency suggests long-tail requests — investigate slow queries or blocking I/O.
                  </li>
                )}
                <li className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Add rate limiting (e.g. 429 responses) to shed excess load gracefully.
                </li>
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300 font-medium">
                  All services responded normally under {report.concurrentUsers} concurrent users.
                  The API is production-ready for this load profile.
                </p>
              </div>
            </div>
          )}

          {/* Dismiss */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-widest bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
          >
            DISMISS REPORT
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
