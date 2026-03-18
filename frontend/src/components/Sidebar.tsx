"use client";

import Link from "next/link";
import { LayoutDashboard, Settings, ActivitySquare, TerminalSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Engine Config", href: "/dashboard/config", icon: Settings },
  { name: "Live Terminal", href: "/dashboard/terminal", icon: TerminalSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen border-r border-[#1e293b] bg-[#020617] flex flex-col p-4">
      <div className="flex items-center gap-3 mb-10 px-2 mt-4">
        <ActivitySquare className="text-blue-500 w-8 h-8" />
        <span className="font-bold text-xl tracking-tight text-white">AeroLoad</span>
      </div>
      
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}