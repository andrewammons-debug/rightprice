"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  Search, 
  Printer, 
  Eye, 
  Download,
  FileText,
  Car,
  ShieldCheck,
  Zap,
  Loader2 as LoaderIcon,
  RefreshCw,
  Clock,
  ExternalLink
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateNativePdf } from "@/lib/pdfEngine";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FrontLineLedger() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const fetchReadyVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inspection', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // Filter specifically for "READY" status
        const ready = data.filter((v: any) => 
          v.paid_status?.toUpperCase() === "READY"
        ).sort((a: any, b: any) => new Date(b.updated_at || b.inspection_date).getTime() - new Date(a.updated_at || a.inspection_date).getTime());
        setVehicles(ready);
      }
    } catch (e) {
      console.error("Fetch ready fail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyVehicles();
  }, []);

  const handlePdfAction = async (v: any) => {
    setGeneratingPdf(v.id);
    try {
      // Map back to FormData structure
      const formData = {
        year: v.year,
        make: v.make,
        modelPkg: v.model,
        body: v.body,
        miles: v.miles,
        color: v.color,
        autoManual: v.transmission,
        vin: v.vin,
        purchasedFrom: v.purchased_from,
        price: v.price?.toString(),
        down: v.down_payment?.toString(),
        paid: v.paid_status,
        remarks: v.remarks,
        signature: v.inspector_name,
        date: v.inspection_date,
        checklist: typeof v.checklist === 'string' ? JSON.parse(v.checklist) : v.checklist
      };
      
      const pdfBytes = await generateNativePdf(formData as any);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error("PDF generation failed", e);
      alert("PDF Error: Failed to generate high-precision report.");
    } finally {
      setGeneratingPdf(null);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.vin.toLowerCase().includes(search.toLowerCase()) ||
    v.make.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <nav className="bg-slate-900 fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-4 border-b border-emerald-500/20 shadow-2xl">
        <button 
          onClick={() => window.location.href = '/lot-rot'}
          className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Back to Lot Rot</span>
        </button>
        <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Front Line Ledger
        </div>
        <div className="w-10 h-10 rounded-sm bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">READY</div>
      </nav>

      <main className="pt-24 pb-36 px-4 md:px-10 w-full max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b-8 border-emerald-500 pb-12">
            <div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">Finished Units</h1>
                <p className="text-[10px] font-bold tracking-[0.3em] text-emerald-500/60 uppercase pl-1 italic">Authorized Front Line Inventory Ledger</p>
            </div>
            
            <div className="w-full md:w-96 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  placeholder="Filter Finished Inventory..."
                  className="w-full bg-white/5 border border-white/10 pl-11 pr-6 py-4 rounded-sm text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-sm overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Vehicle</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">VIN Intelligence</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Audit Date</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">
                                    Syncing Front Line Intelligence...
                                </td>
                            </tr>
                        ) : filteredVehicles.length > 0 ? (
                            filteredVehicles.map((v) => (
                                <tr key={v.id} className="group hover:bg-white/5 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black italic text-white uppercase leading-none">{v.year} {v.make}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{v.model}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-mono font-black tracking-widest text-emerald-500">{v.vin}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">{v.inspection_date}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                              onClick={() => handlePdfAction(v)}
                                              disabled={generatingPdf === v.id}
                                              className="p-3 bg-white/5 border border-white/10 rounded-sm text-white hover:bg-emerald-500 transition-all active:scale-90 flex items-center gap-2 group/btn"
                                            >
                                                {generatingPdf === v.id ? (
                                                    <LoaderIcon className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Printer className="w-4 h-4" />
                                                )}
                                                <span className="text-[8px] font-black uppercase hidden group-hover/btn:block">Precision Report</span>
                                            </button>
                                            <button 
                                              onClick={() => window.location.href = `/lot-rot?vin=${v.vin}`}
                                              className="p-3 bg-white/5 border border-white/10 rounded-sm text-slate-500 hover:text-white hover:bg-slate-800 transition-all active:scale-90"
                                              title="Review Service Log"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-32 flex flex-col items-center justify-center text-center">
                                    <Zap className="w-12 h-12 text-slate-800 mb-4 animate-pulse" />
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-white/20">Lead Ledger Empty</h3>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest max-w-xs mt-2">
                                        Vehicles marked as <span className="text-emerald-500 font-black italic">READY</span> in Lot Rot will appear here.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <footer className="mt-20 border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
            <div className="flex items-center gap-4">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Integrated Inventory Precision Module</span>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Last Intelligence Sync: {new Date().toLocaleTimeString()}
            </span>
        </footer>
      </main>
    </div>
  );
}
