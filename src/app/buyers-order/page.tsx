"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, Download, Share2, Loader2, Search, RotateCcw } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Plain underline field — matches the original paper form aesthetic
const Fd = ({ label, value, onChange, w, lw }: {
  label?: string; value: string; onChange: (v: string) => void; w?: string; lw?: string;
}) => (
  <div className={`flex items-baseline gap-[3px] min-w-0 ${w ? "" : "flex-1"}`} style={w ? { width: w } : {}}>
    {label && <span className="text-[8.5px] text-black whitespace-nowrap shrink-0" style={lw ? { minWidth: lw } : {}}>{label}</span>}
    <div className="border-b border-black flex-1 min-w-0">
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-[9px] text-black outline-none leading-none" />
    </div>
  </div>
);

// Simple field row — just padding, no borders (underlines come from Fd)
const R = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex items-center py-[3px]">{children}</div>
);

const BLANK = () => ({
  date: "", customerName: "", street: "", city: "", st: "", zip: "",
  unitYear: "", unitMake: "", unitModel: "", unitVin: "", mileage: "", color: "",
  sellingPrice: "", tradeAllowance: "", netDifference: "", licenseTitle: "",
  stateTax: "", localTax: "", payoffTrade: "", subtotal: "", lessCash: "", balanceDue: "",
  tradeYearMake: "", tradeModel: "", tradeVin: "", tradeMileage: "",
  approvedBy: "", buyerSignature: "", lienInFavorOf: "",
});

export default function BuyersOrder() {
  const [form, setForm] = useState(BLANK());
  const [vinInput, setVinInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pgMargin, setPgMargin] = useState(0.25);
  const ref = useRef<HTMLDivElement>(null);

  const set = (f: keyof ReturnType<typeof BLANK>) => (v: string) => setForm(p => ({ ...p, [f]: v }));
  const handleClear = () => { if (confirm("Clear all fields?")) setForm(BLANK()); };
  const pageH = `calc(11in - ${(pgMargin * 2).toFixed(2)}in)`;

  const lookupVehicle = async () => {
    const q = vinInput.trim(); if (!q) return;
    setLooking(true);
    try {
      const res = await fetch(`/api/inspection?vin=${encodeURIComponent(q)}`);
      const data = await res.json();
      const v = Array.isArray(data) && data[0];
      if (v) setForm(prev => ({ ...prev, unitYear: v.year||prev.unitYear, unitMake: v.make||prev.unitMake, unitModel: v.model||prev.unitModel, unitVin: v.vin||prev.unitVin, mileage: v.miles||prev.mileage, color: v.color||prev.color }));
      else alert("No vehicle found for that VIN.");
    } catch { alert("Lookup failed. Check your connection."); }
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
      pdf.save(`Buyers_Order_${form.customerName||"Customer"}.pdf`);
    } finally { setBusy(false); }
  };
  const handleShare = async () => {
    setBusy(true);
    try {
      const c = await capture(1.5); if (!c) return;
      const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!),"image/png"));
      const file = new File([blob],`Buyers_Order_${form.customerName||"Customer"}.png`,{type:"image/png"});
      if (navigator.canShare?.({files:[file]})) await navigator.share({files:[file],title:"Buyers Order"});
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
            margin: 0 auto !important; display: flex !important; flex-direction: column !important;
          }
        }
        .hide-ui .no-print { display: none !important; }
      `}</style>

      <nav className="no-print bg-slate-900 fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 border-b border-white/5 shadow-2xl">
        <Link href="/forms" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Forms</span>
        </Link>
        <div className="text-base font-black tracking-tighter text-white uppercase italic">Buyers Order</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded border border-white/10">
            <button onClick={() => setPgMargin(m => Math.max(0.25, parseFloat((m-0.25).toFixed(2))))} className="text-white/60 hover:text-white w-4 text-center font-bold">−</button>
            <span className="text-[9px] text-white/70 w-6 text-center tabular-nums">{pgMargin}"</span>
            <button onClick={() => setPgMargin(m => Math.min(1.0, parseFloat((m+0.25).toFixed(2))))} className="text-white/60 hover:text-white w-4 text-center font-bold">+</button>
            <span className="text-[8px] text-white/30 uppercase ml-0.5">margin</span>
          </div>
          <button onClick={handleClear} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-red-900 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors"><RotateCcw className="w-3 h-3" /> Clear</button>
          <button onClick={handlePrint} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors"><Printer className="w-3 h-3" /> Print</button>
          <button onClick={handleDownload} disabled={busy} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider rounded disabled:opacity-50 transition-colors">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
          </button>
          <button onClick={handleShare} disabled={busy} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider rounded disabled:opacity-50 transition-colors">
            <Share2 className="w-3 h-3" /> Share
          </button>
        </div>
      </nav>

      <div className="no-print fixed top-[52px] w-full z-40 bg-slate-800 border-b border-white/10 px-4 py-2 flex items-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">VIN Lookup</span>
        <input value={vinInput} onChange={e => setVinInput(e.target.value)} onKeyDown={e => { if (e.key==="Enter") lookupVehicle(); }}
          placeholder="Enter VIN to auto-fill vehicle data..."
          className="flex-1 max-w-xs bg-slate-700 border border-white/10 rounded px-3 py-1 text-[10px] text-white placeholder-white/30 outline-none focus:border-white/30" />
        <button onClick={lookupVehicle} disabled={looking} className="flex items-center gap-1 px-3 py-1 bg-primary hover:bg-primary/80 text-white text-[9px] font-bold uppercase tracking-wider rounded disabled:opacity-50">
          {looking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} Load
        </button>
      </div>

      <main className="pt-[88px] pb-10 px-4 flex justify-center print:pt-0 print:pb-0 print:px-0 print:block">
        <div ref={ref} className="paper-form bg-white text-black shadow-lg"
          style={{ width:"7.5in", minHeight: pageH, display:"flex", flexDirection:"column", fontFamily:"Arial, sans-serif", border:"1px solid #ccc" }}>

          {/* ── Header ── */}
          <div className="text-center py-2 border-b border-black flex-none">
            <p className="text-[15px] font-black uppercase tracking-wide leading-tight">RIGHT PRICE AUTO SALES, INC.</p>
            <p className="text-[10px] font-bold uppercase leading-tight">5223 NW BROAD STREET</p>
            <p className="text-[10px] font-bold uppercase leading-tight">MURFREESBORO, TN. 37129</p>
            <p className="text-[10px] font-bold uppercase leading-tight">615-893-1727</p>
          </div>

          {/* ── BUYERS ORDER centered, Date right-balanced ── */}
          <div className="flex items-center px-3 py-[5px] border-b border-black flex-none">
            <div style={{ width: "110px" }} />
            <span className="flex-1 text-center text-[13px] font-bold uppercase tracking-widest">BUYERS ORDER</span>
            <Fd label="Date" value={form.date} onChange={set("date")} w="110px" />
          </div>

          {/* ── Customer Info ── */}
          <div className="px-3 pt-1.5 pb-1 border-b border-black flex-none flex flex-col gap-[5px]">
            <Fd label="Customer's Name" value={form.customerName} onChange={set("customerName")} />
            <div className="flex gap-4">
              <Fd label="Street" value={form.street} onChange={set("street")} />
              <Fd label="City" value={form.city} onChange={set("city")} />
              <Fd label="St" value={form.st} onChange={set("st")} w="38px" />
              <Fd label="Zip" value={form.zip} onChange={set("zip")} w="58px" />
            </div>
          </div>

          {/* ── Unit Sold ── */}
          <div className="px-3 pt-1 pb-1.5 border-b border-black flex-none flex flex-col gap-[5px]">
            <div className="flex gap-4 items-baseline">
              <span className="text-[8.5px] text-black whitespace-nowrap">Unit Sold</span>
              <Fd label="Year" value={form.unitYear} onChange={set("unitYear")} w="58px" />
              <Fd label="Make" value={form.unitMake} onChange={set("unitMake")} />
              <Fd label="Model" value={form.unitModel} onChange={set("unitModel")} />
              <Fd label="Vin #" value={form.unitVin} onChange={set("unitVin")} />
            </div>
            <div className="flex gap-4">
              <Fd label="Mileage" value={form.mileage} onChange={set("mileage")} w="160px" />
              <Fd label="Color" value={form.color} onChange={set("color")} w="160px" />
            </div>
          </div>

          {/* ── Body ── fills remaining page height ── */}
          <div className="grid grid-cols-2" style={{ flex: 1 }}>

            {/* LEFT — items stacked; lw fixes label widths so all underlines align */}
            <div className="border-r border-black px-3 py-2 flex flex-col">
              <R><Fd label="Selling Price" lw="96px" value={form.sellingPrice} onChange={set("sellingPrice")} /></R>
              <R><Fd label="Trade Allowance" lw="96px" value={form.tradeAllowance} onChange={set("tradeAllowance")} /></R>
              <R><Fd label="Net Difference" lw="96px" value={form.netDifference} onChange={set("netDifference")} /></R>
              <R><Fd label="License and Title" lw="96px" value={form.licenseTitle} onChange={set("licenseTitle")} /></R>
              <R><Fd label="State Tax" lw="96px" value={form.stateTax} onChange={set("stateTax")} /></R>
              <R><Fd label="Local Tax" lw="96px" value={form.localTax} onChange={set("localTax")} /></R>
              <R><Fd label="Payoff on trade" lw="96px" value={form.payoffTrade} onChange={set("payoffTrade")} /></R>
              <R><Fd label="Subtotal" lw="96px" value={form.subtotal} onChange={set("subtotal")} /></R>
              <R><Fd label="Less cash received" lw="96px" value={form.lessCash} onChange={set("lessCash")} /></R>
              <R><Fd label="Balance Due" lw="96px" value={form.balanceDue} onChange={set("balanceDue")} /></R>
            </div>

            {/* RIGHT — trade-in at top, window notice fills middle, approved by at bottom */}
            <div className="px-3 py-2 flex flex-col">
              <div>
                <R><span className="text-[10px] font-bold uppercase text-black">TRADE IN</span></R>
                <R><Fd label="Year and Make" value={form.tradeYearMake} onChange={set("tradeYearMake")} /></R>
                <R><Fd label="Model" value={form.tradeModel} onChange={set("tradeModel")} /></R>
                <R><Fd label="VIN #" value={form.tradeVin} onChange={set("tradeVin")} /></R>
                <R><Fd label="Mileage" value={form.tradeMileage} onChange={set("tradeMileage")} /></R>
              </div>

              {/* Window notice — grows to fill available space, centered in that space */}
              <div style={{ flex: 1 }} className="flex items-center justify-center py-3 px-2">
                <p className="text-[9px] font-bold text-black leading-relaxed uppercase text-center">
                  THE INFORMATION YOU SEE ON THE WINDOW FORM FOR THE VEHICLE IS PART OF THIS CONTRACT.
                  INFORMATION IN THE WINDOW FORM OVERRIDES ANY CONTRARY PROVISIONS IN THE CONTRACT OF SALES.
                </p>
              </div>

              <R><Fd label="Approved By" value={form.approvedBy} onChange={set("approvedBy")} /></R>
            </div>
          </div>

          {/* ── Terms — full width ── */}
          <div className="px-3 py-2 border-t border-black flex-none">
            <p className="text-[7.5px] font-bold uppercase mb-[3px]">TERMS OF AGREEMENT AND CERTIFICATION</p>
            <p className="text-[7px] text-black leading-snug">
              I agree to pay the balance on the terms specified and accept delivery of the vehicle within 48 hours after I have been notified
              that it is ready. In case I fail to take delivery of the vehicle when notified, my total credits may be retained as liquidated
              damages for your expense and efforts in the matter, and you may dispose of the vehicle(s) without any liability to me whatsoever.
              I certify that I am 18 years of age and hereby acknowledge receipt of copy of this order. I have read, understand and agree that
              this order includes all of the terms and conditions that this order cancels and supersedes any prior agreement and as of the date
              hereof composes the entire agreement relating to the subject matter covered hereby.
            </p>
          </div>

          {/* ── Buyer's Signature ── */}
          <div className="px-3 py-1.5 border-t border-black/30 flex-none">
            <Fd label="Buyer's Signature" value={form.buyerSignature} onChange={set("buyerSignature")} />
          </div>

          {/* ── Lien In Favor of ── */}
          <div className="px-3 py-1.5 border-t border-black/30 flex-none">
            <Fd label="Lien In Favor of" value={form.lienInFavorOf} onChange={set("lienInFavorOf")} />
          </div>

        </div>
      </main>
    </div>
  );
}
