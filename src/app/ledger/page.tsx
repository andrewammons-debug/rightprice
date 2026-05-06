"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Search, 
  Download, 
  Printer, 
  Eye, 
  Mail, 
  MoreHorizontal,
  ChevronRight,
  RefreshCw,
  FileClock,
  Car,
  Filter,
  Clipboard,
  Trash2,
  Edit,
  PlusCircle,
  Wrench,
  CheckCircle,
  X,
  AlertCircle,
  Loader2 as LoaderIcon,
  Database,
  LayoutDashboard
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FormData } from "@/types/inspection";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LedgerPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  
  // Session State
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [processedIds, setProcessedIds] = useState<string[]>([]);
  const [skipClearConfirm, setSkipClearConfirm] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load local states
    const savedSession = JSON.parse(localStorage.getItem("session_ids") || "[]");
    const savedProcessed = JSON.parse(localStorage.getItem("processed_ids") || "[]");
    const savedSkip = localStorage.getItem("skip_clear_confirm") === "true";
    
    setSessionIds(savedSession);
    setProcessedIds(savedProcessed);
    setSkipClearConfirm(savedSkip);
    
    fetchWorkspace(savedSession);

    // Click-away listener
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Registry Search Effect
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (search.length > 1) {
        performRegistrySearch();
        setShowSearch(true);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const fetchWorkspace = async (targetIds: string[] = []) => {
    setLoading(true);
    try {
      const res = await fetch('/api/inspection');
      const data = await res.json();
      const workspaceItems = data.filter((i: any) => targetIds.includes(i.id));
      setInspections(workspaceItems);
    } catch (e) {
      console.error("Fetch workspace failed", e);
    } finally {
      setLoading(false);
    }
  };

  const performRegistrySearch = async () => {
    setIsSearching(true);
    try {
      const endpoint = `/api/inspection?search=${search}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error("Registry search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendToService = async (id: string, vin: string) => {
    setProcessedIds(prev => [...prev, id]);
    try {
      const res = await fetch("/api/inspection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paid: "PURCHASED" }),
      });
      if (res.ok) {
        alert(`SUCCESS: ${vin} deployed to Lot Rot board.`);
        fetchWorkspace(sessionIds);
      } else {
        setProcessedIds(prev => prev.filter(pid => pid !== id));
      }
    } catch (err) {
      setProcessedIds(prev => prev.filter(pid => pid !== id));
    }
  };

  const handleEdit = (record: any) => {
    const formData = mapToFormData(record);
    localStorage.setItem("edit_inspection_data", JSON.stringify({
      id: record.id,
      formData: formData
    }));
    window.location.href = "/intake";
  };

  const handleRemoveFromSession = (id: string) => {
    const newSession = sessionIds.filter(sid => sid !== id);
    setSessionIds(newSession);
    localStorage.setItem("session_ids", JSON.stringify(newSession));
    const newProcessed = processedIds.filter(pid => pid !== id);
    setProcessedIds(newProcessed);
    localStorage.setItem("processed_ids", JSON.stringify(newProcessed));
    setInspections(prev => prev.filter(i => i.id !== id));
  };

  const handleAddToSession = (record: any) => {
    if (sessionIds.includes(record.id)) return;
    const newSession = [...sessionIds, record.id];
    setSessionIds(newSession);
    localStorage.setItem("session_ids", JSON.stringify(newSession));
    fetchWorkspace(newSession);
  };

  const clearLedger = () => {
    if (!skipClearConfirm && !showClearModal) {
      setShowClearModal(true);
      return;
    }
    localStorage.setItem("session_ids", "[]");
    localStorage.setItem("processed_ids", "[]");
    setSessionIds([]);
    setProcessedIds([]);
    setInspections([]);
    setShowClearModal(false);
  };

  const mapToFormData = (record: any): FormData => {
    let checklist = {};
    try {
      checklist = typeof record.checklist === 'string' ? JSON.parse(record.checklist) : record.checklist;
    } catch (e) { }
    return {
      year: record.year || "",
      make: record.make || "",
      modelPkg: record.model || "",
      body: record.body || "",
      miles: record.miles || "",
      color: record.color || "",
      autoManual: record.transmission || "",
      vin: record.vin || "",
      purchasedFrom: record.purchased_from || "",
      paid: record.paid_status || "",
      price: record.price?.toString() || "",
      down: record.down_payment?.toString() || "",
      remarks: record.remarks || "",
      signature: record.inspector_name || "",
      date: record.inspection_date || "",
      checklist: checklist
    };
  };

  const handlePdfAction = async (record: any, action: 'view' | 'save' | 'print') => {
    const formData = mapToFormData(record);
    setLoading(true);
    try {
      const { generateNativePdf } = await import("@/lib/pdfEngine");
      const pdfBlob = await generateNativePdf(formData);
      const url = URL.createObjectURL(pdfBlob);

      if (action === 'print') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        };
      } else if (action === 'save') {
        const a = document.createElement("a");
        a.href = url;
        a.download = `Inspection_${formData.vin || 'Record'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        // View
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error("PDF Fail:", e);
      alert("Error generating native PDF report. Check template availability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen">

      {showClearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
           <div className="bg-white rounded-sm p-10 max-w-lg w-full shadow-2xl">
              <div className="w-20 h-20 rounded-sm bg-slate-950 flex items-center justify-center text-white mb-8 mx-auto shadow-2xl">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-center mb-4">Reset Workspace?</h2>
              <p className="text-center text-slate-500 font-bold leading-relaxed mb-8">This will clear your daily work list. Records are safe in history.</p>
              <div className="flex flex-col gap-4">
                 <button onClick={clearLedger} className="w-full py-5 bg-slate-950 text-white font-black uppercase tracking-[0.2em] rounded-sm shadow-xl">Confirm Clear</button>
                 <button onClick={() => setShowClearModal(false)} className="w-full py-5 border-2 border-slate-100 text-slate-400 font-black uppercase tracking-[0.2em] rounded-sm">Cancel</button>
              </div>
           </div>
        </div>
      )}

      <nav className="bg-slate-950 fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-4 border-b border-white/10 no-print shadow-xl">
        <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic cursor-pointer" onClick={() => window.location.href = '/'}>Right Price Auto Suite</div>
        <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-sm">RA</div>
      </nav>

      <main className="pt-24 pb-36 px-4 md:px-10 w-full max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end border-b-8 border-secondary pb-12">
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-secondary leading-none">Intelligence Ledger</h1>
              <p className="text-[10px] font-bold tracking-[0.3em] text-outline uppercase pl-1 mt-2">Workspace Dashboard v5.0</p>
            </div>
            {sessionIds.length > 0 && (
              <button 
                onClick={clearLedger}
                className="flex items-center gap-3 px-6 py-4 rounded-sm border-2 border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-600 transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" /> Reset Workspace
              </button>
            )}
        </header>

        {/* SEARCH & WORKSPACE CONTROLS */}
        <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between relative z-[60]">
           <div className="relative w-full md:w-96 group" ref={searchContainerRef}>
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
             <input 
               type="text" 
               placeholder="Search Master Database..." 
               className="w-full pl-12 pr-4 py-4 rounded-sm bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
               value={search}
               onChange={(e) => {setSearch(e.target.value); setShowSearch(true);}}
             />
             
             {/* SEARCH REGISTRY DROPDOWN */}
             {showSearch && (search.length > 1) && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-200 rounded-sm shadow-2xl p-6 min-w-[320px] md:min-w-[500px] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence Registry Results</span>
                        {isSearching && <LoaderIcon className="w-4 h-4 animate-spin text-secondary" />}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {searchResults.length > 0 ? (
                           searchResults.map(r => (
                              <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-sm border border-transparent hover:border-secondary/20 transition-all group/res">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase text-slate-900">{r.year} {r.make} {r.model}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{r.vin}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 opacity-40 group-hover/res:opacity-100 transition-opacity">
                                    {!sessionIds.includes(r.id) ? (
                                      <button onClick={() => handleAddToSession(r)} className="p-2.5 rounded-lg bg-primary text-white hover:bg-black transition-all" title="Add to Workspace"><PlusCircle className="w-4 h-4" /></button>
                                    ) : (
                                      <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle className="w-4 h-4" /></div>
                                    )}
                                    <button onClick={() => handlePdfAction(r, 'view')} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary transition-all shadow-sm"><Eye className="w-4 h-4" /></button>
                                    <button onClick={() => handleEdit(r)} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-sm"><Edit className="w-4 h-4" /></button>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No matching records found.</div>
                        )}
                    </div>
                </div>
             )}
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => fetchWorkspace(sessionIds)} className="p-4 rounded-sm bg-white border border-slate-200 text-slate-500 hover:text-primary transition-all active:scale-95 shadow-sm">
                <RefreshCw className={cn("w-6 h-6", loading && "animate-spin")} />
             </button>
             <div className="bg-slate-100 px-6 py-4 rounded-sm border border-slate-200 flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Units: <span className="text-primary">{sessionIds.length}</span></span>
             </div>
           </div>
        </div>

        {/* MAIN WORKSPACE TABLE */}
        <div className="bg-white rounded-sm shadow-2xl border border-slate-100 overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Task</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">VIN Hub</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Color</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Velocity</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center"><LoaderIcon className="w-8 h-8 animate-spin mx-auto text-slate-200" /></td></tr>
                ) : inspections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase italic border-0">
                      Workspace Ready. Search for vehicles or start a new intake to populate your day.
                    </td>
                  </tr>
                ) : (
                  inspections.map((record) => {
                    const isProcessed = processedIds.includes(record.id);
                    return (
                      <tr key={record.id} className={cn("hover:bg-slate-50/80 transition-all group relative", isProcessed && "bg-emerald-50/5 opacity-80")}>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
                              {record.year} {record.make}
                              {isProcessed && <CheckCircle className="w-4 h-4 text-green-600" />}
                            </span>
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest">{record.model}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="inline-flex flex-col">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">VIN Reference</span>
                             <span className="text-sm font-mono font-black tracking-widest">{record.vin}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1 rounded-sm bg-slate-100 border border-slate-200 text-[10px] font-black uppercase text-slate-600">{record.color || "N/A"}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900">{Number(record.miles).toLocaleString()}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Miles</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-2.5">
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleSendToService(record.id, record.vin); }}
                                className={cn(
                                  "p-3 rounded-sm border transition-all shadow-md active:scale-95",
                                  isProcessed ? "bg-emerald-500 border-emerald-600 text-white animate-pulse" : "bg-white border-slate-200 text-secondary hover:bg-secondary hover:text-white"
                                )}
                             >
                                <Wrench className="w-5 h-5" />
                             </button>
                             <button onClick={() => handlePdfAction(record, 'view')} className="p-3 rounded-sm bg-white border border-slate-200 text-slate-600 hover:text-primary transition-all shadow-sm"><Eye className="w-5 h-5" /></button>
                             <button onClick={() => handlePdfAction(record, 'print')} className="p-3 rounded-sm bg-white border border-slate-200 text-slate-600 hover:text-black transition-all shadow-sm"><Printer className="w-5 h-5" /></button>
                             <button onClick={() => handleEdit(record)} className="p-3 rounded-sm bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-sm"><Edit className="w-5 h-5" /></button>
                             <button onClick={() => handleRemoveFromSession(record.id)} className="p-3 rounded-sm bg-white border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm" title="Remove from Workspace"><X className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {inspections.length > 0 && (
          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 no-print pb-20">
             <button onClick={() => alert("Batch notification log initialized.")} className="group relative bg-primary text-white px-12 py-7 rounded-sm shadow-2xl flex items-center justify-center gap-6 hover:bg-black active:scale-95 w-full md:w-auto font-black italic">
               <Mail className="w-8 h-8" />
               <span className="text-lg md:text-xl tracking-widest uppercase font-black">Email Daily Workspace</span>
             </button>
             <button onClick={clearLedger} className="px-12 py-7 rounded-sm border-2 border-slate-200 text-slate-400 font-black uppercase text-lg tracking-widest hover:text-red-600 hover:border-red-100 transition-all active:scale-95 flex items-center gap-4">
               <Trash2 className="w-8 h-8" />
               <span>Clear Entire Workspace</span>
             </button>
          </div>
        )}
      </main>

      {/* MOBILE NAV BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t px-4 py-6 md:hidden z-50 no-print shadow-2xl flex justify-around">
        <button onClick={() => window.location.href = '/intake'} className="flex flex-col items-center gap-1 text-slate-400 font-black uppercase tracking-widest text-[10px]"><Clipboard className="w-6 h-6" /> <span>Intake</span></button>
        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="flex flex-col items-center gap-1 text-primary font-black uppercase tracking-widest text-[10px]"><FileClock className="w-6 h-6" /> <span>Ledger</span></button>
        <button onClick={() => window.location.href = '/lot-rot'} className="flex flex-col items-center gap-1 text-slate-400 font-black uppercase tracking-widest text-[10px]"><Wrench className="w-6 h-6" /> <span>Lot Rot</span></button>
      </div>
    </div>
  );
}
