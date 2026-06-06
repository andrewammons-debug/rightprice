"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, Download, Share2, Loader2, Search, RotateCcw } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Every row — field OR spacer — shares identical height, so horizontal grid lines
// align perfectly across both columns (same pattern as the physical printed form)
const Row = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex items-center" style={{ flex: 1, minHeight: 0 }}>
    {children}
  </div>
);

const F = ({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) => (
  <div className="flex items-baseline gap-[3px] min-w-0 w-full">
    <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap shrink-0">{label}</span>
    <div className="border-b border-black flex-1 min-w-0">
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-[9px] font-medium text-black outline-none leading-none" />
    </div>
  </div>
);

const Radio = ({ group, val, current, label, onChange }: {
  group: string; val: string; current: string; label: string; onChange: (v: string) => void;
}) => (
  <label className="flex items-center gap-[3px] cursor-pointer">
    <input type="radio" name={group} checked={current === val} onChange={() => onChange(val)} className="w-2.5 h-2.5 accent-black shrink-0" />
    <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">{label}</span>
  </label>
);

const BLANK = () => ({
  stockNo: "", year: "", make: "", model: "", miles: "", warranty: "", email: "",
  paymentType: "" as "" | "cash" | "creditCard",
  recurringPmt: "" as "" | "yes" | "no",
  tradeYear: "", tradeMake: "", tradeModel: "", tradeMiles: "", tradeColor: "", tradeAcv: "",
  apr: "", salePrice: "", tradeAllowance: "", tip: "", downPmt: "", pickUpPmts: "",
  datePickUpPmts: "", amtRegPmt: "", pmtFreq: "" as "" | "wk" | "biwk" | "month" | "sem",
  date1stPmt: "", tagType: "" as "" | "newTag" | "transfer", county: "", registration: "",
  notes: "", notes2: "", salesman: "",
});

export default function DealSheet() {
  const [form, setForm] = useState(BLANK());
  const [vinInput, setVinInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pgMargin, setPgMargin] = useState(0.25);
  const ref = useRef<HTMLDivElement>(null);

  const set = (f: keyof ReturnType<typeof BLANK>) => (v: any) => setForm(p => ({ ...p, [f]: v }));
  const handleClear = () => { if (confirm("Clear all fields?")) setForm(BLANK()); };
  const pageH = `calc(11in - ${(pgMargin * 2).toFixed(2)}in)`;

  const lookupVehicle = async () => {
    const q = vinInput.trim(); if (!q) return;
    setLooking(true);
    try {
      const res = await fetch(`/api/inspection?vin=${encodeURIComponent(q)}`);
      const data = await res.json();
      const v = Array.isArray(data) && data[0];
      if (v) setForm(p => ({ ...p, year: v.year||p.year, make: v.make||p.make, model: v.model||p.model, miles: v.miles||p.miles, stockNo: v.vin||p.stockNo }));
      else alert("No vehicle found.");
    } catch { alert("Lookup failed."); }
    finally { setLooking(false); }
  };

  const capture = async (scale = 2) => {
    if (!ref.current) return null;
    ref.current.classList.add("hide-ui");
    const c = await html2canvas(ref.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
    ref.current.classList.remove("hide-ui");
    return c;
  };

  const handlePrint = () => window.print();
  const handleDownload = async () => {
    setBusy(true);
    try {
      const c = await capture(2); if (!c) return;
      const pdf = new jsPDF("p","mm","letter");
      pdf.addImage(c.toDataURL("image/png",1.0),"PNG",0,0,pdf.internal.pageSize.getWidth(),pdf.internal.pageSize.getHeight(),undefined,"FAST");
      pdf.save(`Deal_Sheet_${form.stockNo||"New"}.pdf`);
    } finally { setBusy(false); }
  };
  const handleShare = async () => {
    setBusy(true);
    try {
      const c = await capture(1.5); if (!c) return;
      const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!),"image/png"));
      const file = new File([blob],`Deal_Sheet_${form.stockNo||"New"}.png`,{type:"image/png"});
      if (navigator.canShare?.({files:[file]})) await navigator.share({files:[file],title:"Sold Deal Sheet"});
      else alert("Use Download PDF to save.");
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans print:bg-white">
      <style>{`
        @media print {
          @page { size: letter; margin: ${pgMargin}in; }
          body { margin: 0 !important; background: #fff !important; }
          .no-print { display: none !important; }
          .paper-form {
            width: 100% !important; height: ${pageH} !important;
            min-height: 0 !important; box-shadow: none !important;
            margin: 0 !important; display: flex !important; flex-direction: column !important;
          }
        }
        .hide-ui .no-print { display: none !important; }
      `}</style>

      <nav className="no-print bg-slate-900 fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 border-b border-white/5 shadow-xl">
        <Link href="/forms" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Forms</span>
        </Link>
        <div className="text-sm font-black tracking-tighter text-white uppercase italic">Sold Deal Sheet</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded border border-white/10">
            <button onClick={() => setPgMargin(m => Math.max(0.25, parseFloat((m-0.25).toFixed(2))))} className="text-white/60 hover:text-white w-4 text-center font-bold">−</button>
            <span className="text-[9px] text-white/70 w-6 text-center tabular-nums">{pgMargin}"</span>
            <button onClick={() => setPgMargin(m => Math.min(1.0, parseFloat((m+0.25).toFixed(2))))} className="text-white/60 hover:text-white w-4 text-center font-bold">+</button>
            <span className="text-[8px] text-white/30 uppercase ml-0.5">margin</span>
          </div>
          <button onClick={handleClear} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-red-900 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors"><RotateCcw className="w-3 h-3" /> Clear</button>
          <button onClick={handlePrint} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors"><Printer className="w-3 h-3" /> Print</button>
          <button onClick={handleDownload} disabled={busy} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
          </button>
          <button onClick={handleShare} disabled={busy} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50">
            <Share2 className="w-3 h-3" /> Share
          </button>
        </div>
      </nav>

      <div className="no-print fixed top-[52px] w-full z-40 bg-slate-800 border-b border-white/10 px-4 py-2 flex items-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">VIN Lookup</span>
        <input value={vinInput} onChange={e => setVinInput(e.target.value)} onKeyDown={e => { if (e.key==="Enter") lookupVehicle(); }}
          placeholder="Enter VIN or Stock # to auto-fill..."
          className="flex-1 max-w-xs bg-slate-700 border border-white/10 rounded px-3 py-1 text-[10px] text-white placeholder-white/30 outline-none focus:border-white/30" />
        <button onClick={lookupVehicle} disabled={looking} className="flex items-center gap-1 px-3 py-1 bg-primary hover:bg-primary/80 text-white text-[9px] font-bold uppercase tracking-wider rounded disabled:opacity-50">
          {looking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} Load
        </button>
      </div>

      <main className="pt-[88px] pb-8 px-4 flex justify-center print:pt-0 print:pb-0 print:px-0 print:block">
        <div ref={ref} className="paper-form bg-white text-black border-2 border-black shadow-lg"
          style={{ width:"7.5in", minHeight: pageH, display:"flex", flexDirection:"column", fontFamily:"Arial, sans-serif" }}>

          {/* Title */}
          <div className="border-b-2 border-black text-center py-1 flex-none">
            <span className="text-[17px] font-black uppercase tracking-[0.2em] underline">SOLD DEAL SHEET</span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-2 border-b border-black flex-none">
            <div className="px-2 py-[2px] border-r-2 border-black text-[9px] font-black uppercase underline">SOLD VEHICLE</div>
            <div className="px-2 py-[2px] flex items-center gap-8">
              <span className="text-[9px] font-black uppercase underline">FINANCE</span>
              <span className="text-[9px] font-black uppercase underline">CASH</span>
            </div>
          </div>

          {/* Body — both columns have exactly 17 Row items → rows align perfectly */}
          <div className="grid grid-cols-2" style={{ flex: 1 }}>

            {/* LEFT — 17 rows */}
            <div className="border-r-2 border-black px-2 py-0 flex flex-col" style={{ flex: 1 }}>
              <Row><F label="STOCK #" value={form.stockNo} onChange={set("stockNo")} /></Row>
              <Row><F label="YEAR" value={form.year} onChange={set("year")} /></Row>
              <Row><F label="MAKE" value={form.make} onChange={set("make")} /></Row>
              <Row><F label="MODEL" value={form.model} onChange={set("model")} /></Row>
              <Row><F label="MILES" value={form.miles} onChange={set("miles")} /></Row>
              <Row><F label="WARRANTY" value={form.warranty} onChange={set("warranty")} /></Row>
              <Row><F label="EMAIL ADDRESS" value={form.email} onChange={set("email")} /></Row>
              <Row>
                <div className="flex items-center gap-4">
                  <Radio group="payType" val="cash" current={form.paymentType} label="CASH" onChange={set("paymentType")} />
                  <Radio group="payType" val="creditCard" current={form.paymentType} label="CREDIT CARD" onChange={set("paymentType")} />
                </div>
              </Row>
              <Row>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">RECURRING PMT:</span>
                  <Radio group="recurPmt" val="yes" current={form.recurringPmt} label="YES" onChange={set("recurringPmt")} />
                  <Radio group="recurPmt" val="no" current={form.recurringPmt} label="NO" onChange={set("recurringPmt")} />
                </div>
              </Row>
              {/* Row 10 — blank spacer creates natural visual section break before Trade-In */}
              <Row />
              <Row><span className="text-[8px] font-black uppercase underline text-black">TRADE-IN</span></Row>
              <Row><F label="YEAR" value={form.tradeYear} onChange={set("tradeYear")} /></Row>
              <Row><F label="MAKE" value={form.tradeMake} onChange={set("tradeMake")} /></Row>
              <Row><F label="MODEL" value={form.tradeModel} onChange={set("tradeModel")} /></Row>
              <Row><F label="MILES" value={form.tradeMiles} onChange={set("tradeMiles")} /></Row>
              <Row><F label="COLOR" value={form.tradeColor} onChange={set("tradeColor")} /></Row>
              <Row><F label="ACV" value={form.tradeAcv} onChange={set("tradeAcv")} /></Row>
            </div>

            {/* RIGHT — 17 rows */}
            <div className="px-2 py-0 flex flex-col" style={{ flex: 1 }}>
              <Row><F label="APR" value={form.apr} onChange={set("apr")} /></Row>
              <Row><F label="SALE PRICE" value={form.salePrice} onChange={set("salePrice")} /></Row>
              <Row><F label="TRADE ALLOWANCE" value={form.tradeAllowance} onChange={set("tradeAllowance")} /></Row>
              <Row><F label="*TIP" value={form.tip} onChange={set("tip")} /></Row>
              <Row><F label="DOWN PMT" value={form.downPmt} onChange={set("downPmt")} /></Row>
              <Row><F label="PICK UP PMTS" value={form.pickUpPmts} onChange={set("pickUpPmts")} /></Row>
              <Row><F label="DATE OF PICK UP PMTS" value={form.datePickUpPmts} onChange={set("datePickUpPmts")} /></Row>
              <Row><F label="AMT OF REG PMT" value={form.amtRegPmt} onChange={set("amtRegPmt")} /></Row>
              <Row>
                <div className="flex items-center gap-3">
                  {(["wk","biwk","month","sem"] as const).map(f => (
                    <Radio key={f} group="pmtFreq" val={f} current={form.pmtFreq} label={f==="biwk"?"BI-WK":f.toUpperCase()} onChange={set("pmtFreq")} />
                  ))}
                </div>
              </Row>
              <Row><F label="DATE OF 1ST PMT" value={form.date1stPmt} onChange={set("date1stPmt")} /></Row>
              <Row>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1"><span className="text-[8px] font-bold uppercase text-black">NEW TAG</span><Radio group="tagType" val="newTag" current={form.tagType} label="" onChange={set("tagType")} /></div>
                  <div className="flex items-center gap-1"><span className="text-[8px] font-bold uppercase text-black">TRANSFER</span><Radio group="tagType" val="transfer" current={form.tagType} label="" onChange={set("tagType")} /></div>
                </div>
              </Row>
              <Row><F label="COUNTY" value={form.county} onChange={set("county")} /></Row>
              <Row>
                <div className="flex items-baseline gap-1 w-full">
                  <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">REGISTRATION</span>
                  <div className="border-b border-black flex-1 min-w-0"><input value={form.registration} onChange={e => set("registration")(e.target.value)} className="w-full bg-transparent text-[9px] font-medium text-black outline-none leading-none" /></div>
                  <span className="text-[8px] font-bold text-black">T</span>
                </div>
              </Row>
              <Row><span className="text-[8px] font-bold uppercase text-black">NOTES</span></Row>
              <Row><div className="border-b border-black/50 w-full"><input value={form.notes} onChange={e => set("notes")(e.target.value)} className="w-full bg-transparent text-[9px] text-black outline-none" /></div></Row>
              <Row><div className="border-b border-black/40 w-full"><input value={form.notes2} onChange={e => set("notes2")(e.target.value)} className="w-full bg-transparent text-[9px] text-black outline-none" /></div></Row>
              <Row><F label="SALESMAN" value={form.salesman} onChange={set("salesman")} /></Row>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
