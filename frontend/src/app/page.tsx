"use client";

import { GridPattern } from "@/components/GridPattern";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#020617] text-white">
      {/* Background Grid */}
      <GridPattern
        width={40}
        height={40}
        x={-1}
        y={-1}
        strokeDasharray={"4 4"}
        className="absolute inset-0 opacity-50"
      />
      
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-400 font-medium mb-8 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          AeroLoad Engine v1.0 is Live
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          Break Your APIs.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            Before Your Users Do.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
        >
          High-performance, concurrent load testing engineered in Core Java. Simulate millions of requests, visualize bottlenecks, and dominate latency.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <Link href="/dashboard">
            <button className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 font-medium text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_60px_rgba(37,99,235,0.6)]">
              <span className="mr-2">Enter Mission Control</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </motion.div>

        {/* Fake Terminal Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl mt-20 rounded-xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="mx-auto flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Terminal className="w-4 h-4" /> root@aeroload: ~
            </div>
          </div>
          <div className="p-6 text-left font-mono text-sm leading-relaxed text-slate-300">
            <div className="text-blue-400">$ ./aeroload attack --url https://api.target.com --users 10000</div>
            <div className="mt-2 text-slate-500">[INFO] Initializing ExecutorService thread pool...</div>
            <div className="text-slate-500">[INFO] Selecting SpikeTestStrategy for instant load.</div>
            <div className="text-emerald-400 mt-2">[200 OK] Received 142ms - Queueing to metrics.csv</div>
            <div className="text-emerald-400">[200 OK] Received 156ms - Queueing to metrics.csv</div>
            <div className="text-amber-400">[WARN] P95 Latency rising... 402ms</div>
            <div className="text-red-400">[503 ERROR] SocketTimeoutException on worker-4022</div>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: [0, 1, 0] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mt-2 text-white bg-white/20 w-2 h-4 inline-block"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
