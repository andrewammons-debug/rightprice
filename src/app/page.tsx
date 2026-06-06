"use client";

import React from "react";
import {
  QrCode,
  CreditCard,
  Wrench,
  ShieldCheck,
  Zap,
  ArrowRight,
  Megaphone,
  FileText,
  ClipboardList,
  Receipt,
  Building2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PortalCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  colorClass, 
  accentColor 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  href: string; 
  colorClass: string;
  accentColor: string;
}) => (
  <button 
    onClick={() => window.location.href = href}
    className={cn(
      "group relative overflow-hidden rounded-sm bg-slate-900/50 border border-white/5 p-8 md:p-12 text-left transition-all hover:bg-slate-800/80 hover:scale-[1.02] active:scale-[0.98] shadow-2xl",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 before:transition-opacity hover:before:opacity-10",
      colorClass
    )}
  >
    <div className={cn("inline-flex p-4 rounded-sm mb-8 shadow-xl", accentColor)}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    
    <div className="space-y-4">
      <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic group-hover:translate-x-2 transition-transform duration-500">
        {title}
      </h3>
      <p className="text-sm font-medium leading-relaxed text-slate-400 uppercase tracking-widest max-w-[280px]">
        {description}
      </p>
    </div>

    <div className="mt-12 flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white transition-colors duration-500">
      <span>Access Portal</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-4 transition-transform duration-500" />
    </div>

    {/* Industrial Decorative Elements */}
    <div className="absolute top-8 right-8 text-[40px] font-black text-white/5 uppercase italic pointer-events-none select-none">
      0{title.split(' ').length}
    </div>
  </button>
);

export default function SuiteLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary selection:text-white flex flex-col font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-sm, border-2 border-white/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-sm, border-2 border-white/10 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-7xl">
          <header className="mb-20 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-sm, border-2 border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-in fade-in slide-in-from-top-4 duration-1000">
              <ShieldCheck className="w-3 h-3" /> Unified Operations Suite v4.0
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none animate-in fade-in slide-in-from-left duration-1000">
              RI<span className="text-primary">G</span>HT PRICE<br />
              AUTO <span className="text-secondary">S</span>UITE
            </h1>
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.5em] text-slate-500 pl-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              Nashville's Premier Digital Automotive Infrastructure
            </p>
          </header>

          {/* Core Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
            <PortalCard
              title="Vehicle Intake"
              description="High-speed VIN intelligence and digital acquisition logging."
              icon={QrCode}
              href="/intake"
              colorClass="hover:before:from-primary/20"
              accentColor="bg-primary"
            />

            <PortalCard
              title="Credit Application"
              description="Seamless multi-point consumer financing and credit intelligence."
              icon={CreditCard}
              href="/credit"
              colorClass="hover:before:from-primary/20"
              accentColor="bg-primary"
            />

            <PortalCard
              title="Lot Rot Service"
              description="Technician digital clipboard and service lifecycle management."
              icon={Wrench}
              href="/lot-rot"
              colorClass="hover:before:from-secondary/20"
              accentColor="bg-secondary"
            />

            <PortalCard
              title="Marketing Hub"
              description="Multi-platform publishing, AI copy generation, and campaign intelligence."
              icon={Megaphone}
              href="/marketing"
              colorClass="hover:before:from-emerald-500/20"
              accentColor="bg-emerald-700"
            />
          </div>

          {/* Dealership Forms */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Dealership Forms</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
              <PortalCard
                title="Express App HS"
                description="Heritage South Community Credit Union express application."
                icon={Building2}
                href="/express-app-hs"
                colorClass="hover:before:from-amber-500/20"
                accentColor="bg-amber-700"
              />
              <PortalCard
                title="Express App"
                description="Generic lender express credit application with editable branding."
                icon={FileText}
                href="/express-app"
                colorClass="hover:before:from-amber-500/20"
                accentColor="bg-amber-600"
              />
              <PortalCard
                title="Deal Sheet"
                description="Sold deal sheet with vehicle lookup and finance breakdown."
                icon={ClipboardList}
                href="/deal-sheet"
                colorClass="hover:before:from-violet-500/20"
                accentColor="bg-violet-700"
              />
              <PortalCard
                title="Buyers Order"
                description="Right Price buyers order with auto-filled vehicle data."
                icon={Receipt}
                href="/buyers-order"
                colorClass="hover:before:from-violet-500/20"
                accentColor="bg-violet-600"
              />
            </div>
          </div>

          <footer className="mt-24 border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">System Status</span>
                 <span className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase italic">
                   <Zap className="w-3 h-3 fill-emerald-500" /> All Portals Operational
                 </span>
               </div>
            </div>
            
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">
              &copy; 2026 Right Price Auto Sales • All Rights Reserved
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
