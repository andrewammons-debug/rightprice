"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Wrench, 
  ChevronLeft, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Search,
  Car,
  ChevronRight,
  ShieldCheck,
  Droplet,
  Zap,
  Hammer,
  Truck,
  Plus,
  Trash2,
  ExternalLink,
  Package,
  Clock,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  Loader2 as LoaderIcon,
  CheckSquare,
  Square,
  ListFilter
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PartEntry = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  status: "ordered" | "arrived";
  link?: string;
};

type ServiceRecord = {
  vin: string;
  year?: string;
  make?: string;
  model?: string;
  safetyStatus?: "pass" | "fail" | "pending";
  checklist?: Record<string, boolean>;
  notes?: string;
  subletFlag?: boolean;
  cosmeticNotes?: string;
  partsLog?: PartEntry[];
  updated_at?: string;
};

export default function LotRotPortal() {
  const [activeTab, setActiveTab] = useState<"list" | "clipboard">("list");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [finishedVehicles, setFinishedVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  
  // Search State
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [serviceRegistry, setServiceRegistry] = useState<Record<string, boolean>>({});
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const [clipboardData, setClipboardData] = useState<ServiceRecord>({
    vin: "",
    safetyStatus: "pending",
    checklist: {
      engine_performance: false,
      transmission_shift: false,
      braking_system: false,
      suspension_integrity: false,
      battery_voltage: false,
    },
    notes: "",
    subletFlag: false,
    cosmeticNotes: "",
    partsLog: []
  });

  const [partQuery, setPartQuery] = useState("");
  const [newPart, setNewPart] = useState({ name: "", vendor: "", price: "" });

  // Fetch Vehicles and Service Registry
  useEffect(() => {
    const initializeData = async () => {
      try {
        const [inspRes, servRes] = await Promise.all([
          fetch('/api/inspection', { cache: 'no-store' }),
          fetch('/api/service', { cache: 'no-store' })
        ]);

        if (inspRes.ok) {
          const data = await inspRes.json();
          // Active Work Orders
          const active = data.filter((v: any) => 
            v.paid_status?.toLowerCase().includes("purchased") || 
            v.paid_status?.toLowerCase().includes("paid")
          );
          setVehicles(active);

          // Recently Finished (READY)
          const finished = data.filter((v: any) => 
             v.paid_status?.toLowerCase() === "ready"
          ).sort((a: any, b: any) => new Date(b.updated_at || b.inspection_date).getTime() - new Date(a.updated_at || a.inspection_date).getTime())
           .slice(0, 5);
          setFinishedVehicles(finished);
        }

        if (servRes.ok) {
          const serviceData = await servRes.json();
          const registry: Record<string, boolean> = {};
          serviceData.forEach((record: any) => {
            if (record.vin) registry[record.vin] = true;
          });
          setServiceRegistry(registry);
        }
      } catch (e) {
        console.error("Initialization Fail:", e);
      } finally {
        setLoading(false);
      }
    };
    // Click-away listener
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    initializeData();
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Registry Search Effect
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (globalSearch.length > 1) {
        handleGlobalSearch();
        setShowSearch(true);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [globalSearch]);

  const handleGlobalSearch = async () => {
    if (!globalSearch.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/inspection?search=${globalSearch}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error("Master Search Fail:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const onboardToLotRot = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/inspection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paid: "PURCHASED" }),
      });
      if (res.ok) {
        // Re-fetch active work orders
        const res2 = await fetch('/api/inspection', { cache: 'no-store' });
        const data = await res2.json();
        const purchasedVehicles = data.filter((v: any) => 
          v.paid_status?.toLowerCase().includes("paid") || 
          v.paid_status?.toLowerCase().includes("purchased") ||
          v.paid_status?.toLowerCase() === "yes"
        );
        setVehicles(purchasedVehicles);
        setGlobalSearch("");
        setSearchResults([]);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Onboarding failed");
      }
    } catch (err: any) {
      alert(`Onboarding failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === vehicles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vehicles.map(v => v.id)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Archive ${selectedIds.size} vehicles? They will be removed from the active board but remain searchable in the master database.`)) return;

    setLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id => 
        fetch("/api/inspection", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, paid: "ARCHIVED" }),
        })
      ));

      // Refresh state
      setVehicles(prev => prev.filter(v => !selectedIds.has(v.id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (e) {
      console.error("Bulk Archive Fail:", e);
      alert("Failed to archive some items.");
    } finally {
      setLoading(false);
    }
  };

  const addPartToLog = () => {
    if (!newPart.name || !newPart.price) return;
    const part: PartEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPart.name,
      vendor: newPart.vendor || "Manual Entry",
      price: parseFloat(newPart.price) || 0,
      status: "ordered"
    };
    setClipboardData(prev => ({
      ...prev,
      partsLog: [...(prev.partsLog || []), part]
    }));
    setNewPart({ name: "", vendor: "", price: "" });
  };

  const removePart = (id: string) => {
    setClipboardData(prev => ({
      ...prev,
      partsLog: (prev.partsLog || []).filter(p => p.id !== id)
    }));
  };

  const openClipboard = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setLoading(true);
    try {
      const res = await fetch(`/api/service?vin=${vehicle.vin}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setClipboardData({
            ...data,
            checklist: typeof data.checklist === 'string' ? JSON.parse(data.checklist) : (data.checklist || clipboardData.checklist),
            partsLog: data.partsLog || []
          });
        } else {
          // Reset if no record exists
          setClipboardData({
            vin: vehicle.vin,
            safetyStatus: "pending",
            checklist: {
              engine_performance: false,
              transmission_shift: false,
              braking_system: false,
              suspension_integrity: false,
              battery_voltage: false,
            },
            notes: "",
            subletFlag: false,
            cosmeticNotes: ""
          });
        }
      }
    } catch (e) {
      console.error("Failed to load service record", e);
    } finally {
      setLoading(false);
      setActiveTab("clipboard");
    }
  };

  const saveClipboard = async () => {
    if (!selectedVehicle?.vin) {
      alert("Error: No vehicle selected or VIN missing.");
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...clipboardData,
        vin: selectedVehicle.vin
      };
      
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setServiceRegistry(prev => ({ ...prev, [selectedVehicle.vin]: true }));
        // Only trigger tab switch if NOT called from completion
        return true;
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Database sync failed");
      }
    } catch (e: any) {
      console.error("Save failed:", e);
      alert(`Commit Failed: ${e.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    const success = await saveClipboard();
    if (success) {
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab("list");
      }, 1500);
    }
  };

  const completeWorkOrder = async () => {
    if (!selectedVehicle?.id) return;
    setCompleting(true);
    try {
      // 1. Sync final state
      const syncSuccess = await saveClipboard();
      if (!syncSuccess) {
        setCompleting(false);
        return;
      }
      
      // 2. Patch status
      const res = await fetch("/api/inspection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedVehicle.id, paid: "READY" }),
      });

      if (res.ok) {
        // Refresh local state immediately
        const refreshRes = await fetch('/api/inspection', { cache: 'no-store' });
        if (refreshRes.ok) {
           const allData = await refreshRes.json();
           
           // Filter active
           const active = allData.filter((v: any) => 
             v.paid_status?.toLowerCase().includes("purchased") || 
             v.paid_status?.toLowerCase().includes("paid")
           );
           setVehicles(active);

           // Filter finished
           const finished = allData.filter((v: any) => 
             v.paid_status?.toLowerCase() === "ready"
           ).sort((a: any, b: any) => new Date(b.updated_at || b.inspection_date).getTime() - new Date(a.updated_at || a.inspection_date).getTime())
            .slice(0, 5);
           setFinishedVehicles(finished);
        }
        
        // Success feedback then exit
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setActiveTab("list");
          setCompleting(false);
        }, 1000);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "promotion failed at database level");
      }
    } catch (e: any) {
      console.error("Completion error:", e);
      alert(`Completion Failed: ${e.message}`);
      setCompleting(false);
    }
  };

  const dispatchSearch = (vendor: 'ebay' | 'google' | 'amazon', mode: 'cheap' | 'fast') => {
    if (!selectedVehicle) return;
    const { year, make, model } = selectedVehicle;
    const q = encodeURIComponent(`${year} ${make} ${model} ${partQuery}`);
    let url = "";

    if (vendor === 'ebay') {
      const sort = mode === 'cheap' ? '&_sop=15' : '&_sop=12';
      url = `https://www.ebay.com/sch/i.html?_nkw=${q}${sort}`;
    } else if (vendor === 'amazon') {
      const filter = mode === 'fast' ? '&rh=p_85%3A2470955011' : '&s=price-asc-rank';
      url = `https://www.amazon.com/s?k=${q}${filter}`;
    } else {
      // Upgraded RockAuto Logic: Direct Catalog Search (much more professional)
      // Format: /en/catalog/Make,Year,Model
      const raMake = make.toLowerCase().replace(/\s+/g, '+');
      const raModel = model.toLowerCase().replace(/\s+/g, '+');
      url = `https://www.rockauto.com/en/catalog/${raMake},${year},${raModel}`;
      
      // If a specific query exists, we append it to search within that catalog
      if (partQuery) {
        url = `https://www.google.com/search?q=${year}+${make}+${model}+${partQuery}+RockAuto+catalog`;
      }
    }
    
    window.open(url, '_blank');
  };

  const resetClipboardData = () => {
    if (!window.confirm("CRITICAL: This will wipe all current notes, parts, and checklists for this vehicle. Are you sure?")) return;
    
    setClipboardData({
      vin: selectedVehicle?.vin || "",
      safetyStatus: "pending",
      checklist: {
        engine_performance: false,
        transmission_shift: false,
        braking_system: false,
        suspension_integrity: false,
        battery_voltage: false,
      },
      notes: "",
      subletFlag: false,
      cosmeticNotes: "",
      partsLog: []
    });
  };

  const totalReconCost = clipboardData.partsLog?.reduce((sum, p) => sum + p.price, 0) || 0;

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans selection:bg-secondary selection:text-white">
      {/* Navigation */}
      <nav className="bg-slate-900 fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-4 border-b border-white/5 shadow-2xl">
        <button 
          onClick={() => activeTab === "clipboard" ? setActiveTab("list") : window.location.href = '/'}
          className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">{activeTab === "clipboard" ? "Back to Orders" : "Back to Suite"}</span>
        </button>
        <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic">Right Price Lot Rot</div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end leading-none">
              <span className="text-[8px] font-black uppercase text-secondary tracking-widest">Master Link</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm animate-pulse" /> Active
              </span>
           </div>
           <div className="w-10 h-10 rounded-sm, border-2 border-white/10 bg-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg">RA</div>
        </div>
      </nav>

      <main className="pt-24 pb-36 px-4 md:px-10 w-full max-w-7xl mx-auto">
        {activeTab === "list" ? (
          <div className="animate-in fade-in duration-500">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b-8 border-secondary pb-12">
                <div className="flex flex-col gap-2">
                   <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">Active Work Orders</h1>
                   <div className="flex items-center gap-4">
                      <p className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase pl-1 italic">Authorized Technician Surveillance</p>
                      <button 
                        onClick={() => window.location.href = '/front-line'}
                        className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-[8px] font-black uppercase text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                         <ExternalLink className="w-3 h-3" />
                         Ready Ledger
                      </button>
                   </div>
                </div>
               
               <div className="w-full md:w-96 relative z-[100]" ref={searchContainerRef}>
                 <div className="flex gap-2">
                   <div className="relative flex-1 group">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-secondary transition-colors" />
                     <input 
                       placeholder="Search Master Database..."
                       className="w-full bg-white/5 border border-white/10 pl-11 pr-6 py-4 rounded-sm text-xs font-bold focus:outline-none focus:border-secondary transition-all"
                       value={globalSearch}
                       onChange={(e) => {setGlobalSearch(e.target.value); setShowSearch(true);}}
                     />
                   </div>
                 </div>
                 
                 {/* Intelligence Registry Dropdown (Ledger Style) */}
                 {showSearch && (globalSearch.length > 1) && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-200 rounded-sm shadow-2xl p-6 min-w-[320px] md:min-w-[500px] animate-in slide-in-from-top-4 duration-300 overflow-hidden text-slate-900 overflow-y-auto max-h-[400px]">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Master Intelligence Results</span>
                            {isSearching ? <div className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin" /> : (
                              <button onClick={() => {setShowSearch(false); setSearchResults([]);}} className="text-[8px] font-black uppercase text-slate-500 hover:text-primary transition-colors">Clear</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {searchResults.length > 0 ? (
                                searchResults.map(sr => (
                                    <div key={sr.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-sm border border-transparent hover:border-secondary/20 transition-all group/res">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase text-slate-900">{sr.year} {sr.make} {sr.model}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{sr.vin}</span>
                                        </div>
                                        <button 
                                          onClick={() => onboardToLotRot(sr.id)}
                                          className="px-4 py-2 bg-secondary text-white rounded-sm text-[8px] font-black uppercase hover:bg-slate-900 transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Deploy to Board
                                        </button>
                                    </div>
                                ))
                            ) : !isSearching && (
                               <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No matching records found.</div>
                            )}
                        </div>
                    </div>
                 )}
               </div>
            </header>

            {/* Recently Finished Section (New) */}
            {finishedVehicles.length > 0 && (
              <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-3 mb-6 border-l-4 border-emerald-500 pl-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-white leading-none">Recently Finished (Quick-Ref)</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {finishedVehicles.map(fv => (
                    <button 
                      key={fv.id}
                      onClick={() => openClipboard(fv)}
                      className="bg-slate-900/80 border border-emerald-500/20 p-4 rounded-sm text-left hover:bg-slate-800 transition-all group"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-white uppercase truncate">{fv.year} {fv.make}</span>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{fv.vin.slice(-6)}</span>
                          <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">READY</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Toolbar */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/80 border border-white/10 p-4 rounded-sm">
                <div className="flex items-center gap-6">
                   <button 
                     onClick={() => setIsSelectionMode(!isSelectionMode)}
                     className={cn(
                       "flex items-center gap-2 px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
                       isSelectionMode ? "bg-white text-slate-950" : "bg-slate-800 text-white hover:bg-slate-700"
                     )}
                   >
                      <ListFilter className="w-4 h-4" />
                      {isSelectionMode ? "Exit Selection" : "Bulk Actions"}
                   </button>
                   
                   {isSelectionMode && (
                     <div className="flex items-center gap-4 animate-in slide-in-from-left duration-300">
                        <button onClick={selectAll} className="text-[10px] font-black uppercase text-secondary hover:text-white transition-colors">
                           {selectedIds.size === vehicles.length ? "Deselect All" : "Select All Units"}
                        </button>
                        <div className="w-px h-4 bg-white/10" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{selectedIds.size} Selected</span>
                     </div>
                   )}
                </div>

                {isSelectionMode && selectedIds.size > 0 && (
                   <button 
                    onClick={handleBulkArchive}
                    className="w-full md:w-auto px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:scale-[1.02] active:scale-0.95 transition-all shadow-lg flex items-center justify-center gap-2"
                   >
                      <Trash2 className="w-4 h-4" />
                      Clear selection from board
                   </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Scanning Network Intelligence...</div>
              ) : vehicles.length > 0 ? (
                vehicles.map(v => (
                  <button 
                    key={v.id}
                    onClick={() => isSelectionMode ? toggleSelection(v.id) : openClipboard(v)}
                    className={cn(
                        "group bg-slate-900/50 border p-6 rounded-sm text-left transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden",
                        selectedIds.has(v.id) ? "border-secondary bg-secondary/10" : "border-white/5 hover:bg-slate-800"
                    )}
                  >
                    {isSelectionMode && (
                        <div className="absolute top-4 right-4 z-10">
                            {selectedIds.has(v.id) ? (
                                <CheckSquare className="w-6 h-6 text-secondary fill-secondary/20" />
                            ) : (
                                <Square className="w-6 h-6 text-white/20" />
                            )}
                        </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black italic text-white uppercase leading-none">{v.year} {v.make}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{v.model}</span>
                      </div>
                      <div className="p-2 bg-secondary/10 rounded-sm">
                        <Car className="w-5 h-5 text-secondary" />
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-6">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-500">VIN Intelligence</span>
                         <span className="text-white">{v.vin.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-500">Last Seen</span>
                         <span className="text-white">{v.inspection_date}</span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          {serviceRegistry[v.vin] ? (
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
                               <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                               <span className="text-[9px] font-black uppercase text-emerald-500">Audit Logs Found</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-sm, border-2 border-white/10 bg-secondary animate-pulse" />
                              <span className="text-[10px] font-black uppercase text-secondary">Awaiting Technical Audit</span>
                            </>
                          )}
                       </div>
                       <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-sm bg-slate-900/20">
                    <div className="w-20 h-20 bg-slate-900 rounded-sm, border-2 border-white/10 flex items-center justify-center mb-6 shadow-2xl relative">
                        <Wrench className="w-8 h-8 text-slate-700" />
                        <div className="absolute inset-0 bg-secondary/20 rounded-sm, border-2 border-white/10 blur-2xl animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">No Active Pipeline</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-xs text-center leading-relaxed px-4">
                        Vehicles marked as <span className="text-secondary font-black">PURCHASED</span> in the Intake App will automatically populate here for service review.
                    </p>
                    <button 
                      onClick={() => window.location.href = '/intake'}
                      className="mt-10 px-8 py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all"
                    >
                      Open Intake Portal
                    </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-500 space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-8 border-secondary pb-12">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
                  {selectedVehicle?.year} {selectedVehicle?.make}
                </h1>
                <p className="text-xs font-bold tracking-[0.3em] text-secondary uppercase pl-1 italic">
                  VIN: {selectedVehicle?.vin} Intelligence
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={resetClipboardData}
                  className="px-6 py-4 bg-white/5 hover:bg-red-500/10 border border-white/10 text-white/40 hover:text-red-500 font-black uppercase tracking-widest text-[10px] rounded-sm transition-all active:scale-95 flex items-center gap-2"
                  title="Wipe service data for this vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Record
                </button>
                <button 
                  onClick={handleManualSave}
                  disabled={loading || saveSuccess}
                  className={cn(
                    "px-10 py-4 font-black uppercase tracking-widest text-xs rounded-sm shadow-xl transition-all active:scale-95 flex items-center gap-3",
                    saveSuccess ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-white hover:text-slate-900 border border-white/10"
                  )}
                >
                  {saveSuccess ? <><CheckCircle2 className="w-5 h-5" /> Sync Confirmed</> : (loading ? "Syncing..." : "Commit Clipboard")}
                </button>
                <button 
                  onClick={completeWorkOrder}
                  disabled={completing || loading}
                  className="px-10 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-sm shadow-xl transition-all active:scale-95 flex items-center gap-3 hover:bg-white hover:text-emerald-600 disabled:opacity-50"
                >
                  {completing ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Complete Work Order
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Step 1: Safety & Vital */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-slate-900 p-8 rounded-sm border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8 border-l-4 border-secondary pl-4">
                      <ShieldCheck className="w-5 h-5 text-secondary" />
                      <h3 className="text-xs font-black uppercase tracking-widest leading-none text-white">Safety & Vital Audit</h3>
                    </div>
                    
                    <div className="space-y-2">
                       {Object.keys(clipboardData.checklist || {}).map(item => (
                         <label key={item} className="flex justify-between items-center p-4 bg-white/5 rounded-sm hover:bg-white/10 transition-all cursor-pointer">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                               {item.replace(/_/g, ' ')}
                            </span>
                            <input 
                              type="checkbox" 
                              checked={clipboardData.checklist?.[item]} 
                              onChange={(e) => setClipboardData({
                                ...clipboardData, 
                                checklist: {...clipboardData.checklist, [item]: e.target.checked}
                              })}
                              className="w-6 h-6 rounded-lg bg-transparent border-white/20 text-secondary" 
                            />
                         </label>
                       ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Final Safety Authorization</label>
                       <div className="grid grid-cols-3 gap-2">
                          {['fail', 'pending', 'pass'].map(s => (
                            <button 
                              key={s}
                              onClick={() => setClipboardData({...clipboardData, safetyStatus: s as any})}
                              className={cn(
                                "py-3 rounded-sm text-[10px] font-black uppercase tracking-tighter border transition-all",
                                clipboardData.safetyStatus === s 
                                  ? (s === 'pass' ? "bg-emerald-500 border-emerald-500 text-white" : s === 'fail' ? "bg-primary border-primary text-white" : "bg-slate-700 border-slate-700 text-white")
                                  : "bg-transparent border-white/10 text-slate-500"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 rounded-sm border border-white/5 shadow-2xl space-y-8">
                    <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                       <ShoppingCart className="w-5 h-5 text-emerald-500" />
                       <h3 className="text-xs font-black uppercase tracking-widest leading-none text-white">Dispatch Parts Agent</h3>
                    </div>

                    <div className="space-y-4">
                       <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Part Name Refinement</label>
                          <input 
                            value={partQuery}
                            onChange={e => setPartQuery(e.target.value)}
                            placeholder="e.g. Alternator, Brake Pads..."
                            className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-sm text-xs font-bold focus:border-emerald-500 outline-none transition-all"
                          />
                       </div>

                       <div className="grid grid-cols-1 gap-3">
                          <div className="flex flex-col gap-2">
                             <span className="text-[8px] font-black uppercase text-slate-600 tracking-tighter">Marketplace Scouts</span>
                             <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => dispatchSearch('ebay', 'cheap')} className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-sm hover:bg-emerald-500/20 group transition-all">
                                   <TrendingDown className="w-4 h-4 text-emerald-500 mb-1" />
                                   <span className="text-[8px] font-black uppercase text-white">eBay Cheap</span>
                                </button>
                                <button onClick={() => dispatchSearch('ebay', 'fast')} className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-sm hover:bg-blue-500/20 group transition-all">
                                   <Clock className="w-4 h-4 text-blue-400 mb-1" />
                                   <span className="text-[8px] font-black uppercase text-white">eBay Fast</span>
                                </button>
                                <button onClick={() => dispatchSearch('amazon', 'fast')} className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-sm hover:bg-orange-500/20 group transition-all">
                                   <Zap className="w-4 h-4 text-orange-400 mb-1" />
                                   <span className="text-[8px] font-black uppercase text-white">Amazon Prime</span>
                                </button>
                                <button onClick={() => dispatchSearch('google', 'cheap')} className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-sm hover:bg-slate-700 group transition-all">
                                   <Search className="w-4 h-4 text-slate-400 mb-1" />
                                   <span className="text-[8px] font-black uppercase text-white">RockAuto</span>
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 border border-white/5 rounded-sm p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Recon Tally</span>
                    <span className="text-4xl font-black italic text-emerald-500 tracking-tighter flex items-center gap-2">
                       <DollarSign className="w-8 h-8" /> {totalReconCost.toFixed(2)}
                    </span>
                 </div>
              </div>

              {/* Step 2 & 3: Notes & Recon */}
              <div className="lg:col-span-8 flex flex-col gap-10">
                 <div className="bg-white text-slate-900 p-8 md:p-12 rounded-sm shadow-2xl relative overflow-hidden">
                    <div className="absolute top-8 right-12 opacity-[0.03] select-none pointer-events-none text-9xl font-black italic">REPORT</div>
                    
                    <div className="flex items-center gap-3 mb-8 border-l-4 border-slate-900 pl-4">
                      <FileText className="w-5 h-5 text-slate-900" />
                      <h3 className="text-xs font-black uppercase tracking-widest leading-none text-slate-900">Mechanical Log Intelligence</h3>
                    </div>

                    <textarea 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-sm p-8 font-bold text-lg focus:outline-none focus:border-secondary transition-all min-h-[200px]"
                      placeholder="Type exactly what you are doing (e.g. replacing rear rotors, pads were at 10%)..."
                      value={clipboardData.notes}
                      onChange={(e) => setClipboardData({...clipboardData, notes: e.target.value})}
                    />

                    <div className="mt-12 flex items-center justify-between p-6 bg-slate-900 text-white rounded-sm shadow-xl">
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sublet Required?</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-1">Does this unit need to leave the lot?</span>
                       </div>
                       <button 
                        onClick={() => setClipboardData({...clipboardData, subletFlag: !clipboardData.subletFlag})}
                        className={cn(
                          "px-6 py-2 rounded-sm, border-2 border-white/10 font-black uppercase text-[10px] tracking-widest transition-all",
                          clipboardData.subletFlag ? "bg-secondary text-white shadow-lg shadow-secondary/40" : "bg-white/10 text-white/20"
                        )}
                       >
                         {clipboardData.subletFlag ? "Flagged for Sublet" : "No Sublet"}
                       </button>
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 md:p-12 rounded-sm border border-white/5 shadow-2xl">
                    <div className="flex justify-between items-center mb-10 border-l-4 border-slate-400 pl-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-slate-400" />
                        <h3 className="text-xs font-black uppercase tracking-widest leading-none text-white">Parts Procurement Log</h3>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{clipboardData.partsLog?.length || 0} ITEMS COMMITTED</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                       <input 
                        placeholder="Part Description" 
                        value={newPart.name} 
                        onChange={e => setNewPart({...newPart, name: e.target.value})}
                        className="md:col-span-5 bg-white/5 border border-white/10 p-4 rounded-sm text-xs font-bold text-white"
                       />
                       <input 
                        placeholder="Vendor" 
                        value={newPart.vendor} 
                        onChange={e => setNewPart({...newPart, vendor: e.target.value})}
                        className="md:col-span-3 bg-white/5 border border-white/10 p-4 rounded-sm text-xs font-bold text-white"
                       />
                       <input 
                        type="number" 
                        placeholder="Price" 
                        value={newPart.price} 
                        onChange={e => setNewPart({...newPart, price: e.target.value})}
                        className="md:col-span-2 bg-white/5 border border-white/10 p-4 rounded-sm text-xs font-bold text-white"
                       />
                       <button onClick={addPartToLog} className="md:col-span-2 bg-slate-100 text-slate-900 font-black uppercase text-[10px] rounded-sm hover:bg-emerald-500 hover:text-white transition-all">Add Item</button>
                    </div>

                    <div className="space-y-3">
                       {clipboardData.partsLog?.map(p => (
                         <div key={p.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-sm group">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 bg-slate-800 rounded-sm flex items-center justify-center font-black text-[10px] text-slate-500">#{clipboardData.partsLog!.indexOf(p)+1}</div>
                               <div className="flex flex-col leading-none">
                                  <span className="text-xs font-black uppercase text-white">{p.name}</span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{p.vendor}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <span className="font-black italic text-emerald-500">${p.price.toFixed(2)}</span>
                               <button onClick={() => removePart(p.id)} className="text-slate-600 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </div>
                       ))}
                       {(!clipboardData.partsLog || clipboardData.partsLog.length === 0) && (
                         <div className="py-12 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-slate-600 uppercase">
                            <Package className="w-10 h-10 mb-4 opacity-10" />
                            <span className="text-[10px] font-black tracking-widest">Registry Empty</span>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 md:p-12 rounded-sm border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8 border-l-4 border-slate-400 pl-4">
                      <Zap className="w-5 h-5 text-slate-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest leading-none text-white">Secondary Recon Audit</h3>
                    </div>
                    
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-6 px-2 leading-relaxed">
                      FLAG OBSERVATIONS MISSED DURING INITIAL INTAKE (GLOSS, INTERIOR TEARS, GLASS CRACKS, PAINT CHIPS).
                    </p>

                    <textarea 
                      className="w-full bg-white/5 border-2 border-white/10 rounded-sm p-8 font-bold text-sm text-white focus:outline-none focus:border-slate-400 transition-all min-h-[120px]"
                      placeholder="Cosmetic or accessory discrepancies..."
                      value={clipboardData.cosmeticNotes}
                      onChange={(e) => setClipboardData({...clipboardData, cosmeticNotes: e.target.value})}
                    />
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
