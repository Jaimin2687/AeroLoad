"use client";

import React, { useState } from "react";
import { Card, Title, Text } from "@tremor/react";
import { motion } from "framer-motion";
import { Save, Server, Zap } from "lucide-react";

export default function ConfigPage() {
  const [globalTimeout, setGlobalTimeout] = useState(3000);
  const [agentName, setAgentName] = useState("AeroLoad-Worker-Pool");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Engine Configuration</h1>
        <p className="text-slate-400 mt-1">Manage global system parameters and JVM executor limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#0b1229] border-[#1e293b]">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-blue-500" />
            <Title className="text-white">Thread Pool Settings</Title>
          </div>
          <div className="space-y-6">
            <div>
              <Text className="mb-2">Max Pre-allocated Threads</Text>
              <input 
                type="number" 
                defaultValue={10000}
                disabled
                className="w-full bg-[#1e293b] border-none text-slate-400 text-sm rounded-md p-2.5 outline-none cursor-not-allowed"
              />
              <Text className="text-xs text-slate-500 mt-1">ExecutorService Max Pool Size (Defined in Java Core)</Text>
            </div>
            <div>
              <Text className="mb-2">Global HTTP Timeout (ms)</Text>
              <input 
                type="number" 
                value={globalTimeout}
                onChange={(e) => setGlobalTimeout(Number(e.target.value))}
                className="w-full bg-[#1e293b] border-none text-white text-sm rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <Text className="mb-2">Worker Agent String</Text>
              <input 
                type="text" 
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full bg-[#1e293b] border-none text-white text-sm rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-[#0b1229] border-[#1e293b]">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-emerald-500" />
            <Title className="text-white">Target APIs</Title>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-sm text-blue-400">GET</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">Active</span>
              </div>
              <Text className="text-white break-all">https://jsonplaceholder.typicode.com/posts</Text>
            </div>
            
            <button className="w-full py-2 border border-dashed border-slate-600 rounded-md text-slate-400 hover:text-white hover:border-slate-400 transition-colors">
              + Register New Endpoint
            </button>
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="py-3 px-8 rounded-md font-bold tracking-wide flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <Save className="w-4 h-4" />
          SAVE CONFIGURATION
        </motion.button>
      </div>

    </div>
  );
}