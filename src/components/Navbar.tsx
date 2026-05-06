"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clipboard, FileClock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navbar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Intake", href: "/", icon: Clipboard },
    { name: "Ledger", href: "/ledger", icon: FileClock },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-6 py-4 flex justify-around items-center z-40 no-print shadow-[0_-10px_30px_rgba(0,0,0,0.05)] md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all active:scale-95",
              isActive ? "text-primary px-4 py-1" : "text-slate-400"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive ? "stroke-[3px]" : "stroke-[2px]")} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export const DesktopNavbar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Intake", href: "/", icon: Clipboard },
    { name: "Ledger", href: "/ledger", icon: FileClock },
  ];

  return (
    <div className="hidden md:flex fixed right-10 top-1/2 -translate-y-1/2 flex-col gap-6 z-40 no-print">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.name}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all bg-white shadow-xl border border-slate-100 hover:scale-110 active:scale-95",
              isActive ? "bg-primary text-white shadow-primary/20" : "text-slate-400 hover:text-secondary"
            )}
          >
            <Icon className={cn("w-7 h-7", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
          </Link>
        );
      })}
    </div>
  );
};
