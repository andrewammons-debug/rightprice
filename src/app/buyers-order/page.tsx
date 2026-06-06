"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, Download, Share2, Loader2, Search } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Inline label + underline input ──────────────────────────────────────────
const F = ({
  label, value, onChange, className = "", inputClass = "", ...rest
}: { label: string; value: string; onChange: (v: string) => void; className?: string; inputClass?: string; [k: string]: any }) => (
  <div className={`flex items-baseline gap-1 min-w-0 ${className}`}>
    {label && <span className="text-[9px] text-black font-normal whitespace-nowrap shrink-0">{label}</span>}
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`border-b border-black bg-transparent text-[10px] text-black outline-none min-w-0 pb-px flex-1 ${inputClass}`}
      {...rest}
    />
  </div>
);

const INITIAL = () => ({
  date: "", customerName: "", street: "", city: "", st: "", zip: "",
  unitYear: "", unitMake: "", unitModel: "", unitVin: "", mileage: "", color: "",
  sellingPrice: "", tradeAllowance: "", netDifference: "", licenseTitle: "",
  stateTax: "", localTax: "", payoffTrade: "", subtotal: "", lessCash: "", balanceDue: "",
  tradeYearMake: "", tradeModel: "", tradeVin: "", tradeMileage: "",
  approvedBy: "", buyerSignature: "", lienInFavorOf: "",
});

export default function BuyersOrder() {
  const [form, setForm] = useState(INITIAL());
  const [vinInput, setVinInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [busy, setBusy] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const set = (field: keyof ReturnType<typeof INITIAL>) => (val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const lookupVehicle = async () => {
    const q = vinInput.trim();
    if (!q) return;
    setLooking(true);
    try {
      const res = await fetch(`/api/inspection?vin=${encodeURIComponent(q)}`);
      const data = await res.json();
      const v = Array.isArray(data) && data[0];
      if (v) {
        setForm(prev => ({
          ...prev,
          unitYear: v.year || prev.unitYear,
          unitMake: v.make || prev.unitMake,
          unitModel: v.model || prev.unitModel,
          unitVin: v.vin || prev.unitVin,
          mileage: v.miles || prev.mileage,
          color: v.color || prev.color,
        }));
      } else {
        alert("No vehicle found for that VIN.");
      }
    } catch { alert("Lookup failed. Check your connection."); }
    finally { setLooking(false); }
  };

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setBusy(true);
    try {
      captureRef.current.classList.add("hide-buttons-for-pdf");
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff",
      });
      captureRef.current.classList.remove("hide-buttons-for-pdf");
      const pdf = new jsPDF("p", "mm", "letter");
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.addImage(canvas.toDataURL("image/png", 1.0), "PNG", 0, 0, w, h, undefined, "FAST");
      pdf.save(`Buyers_Order_${form.customerName || "Customer"}.pdf`);
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const handleShare = async () => {
    if (!captureRef.current) return;
    setBusy(true);
    try {
      captureRef.current.classList.add("hide-buttons-for-pdf");
      const canvas = await html2canvas(captureRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
      captureRef.current.classList.remove("hide-buttons-for-pdf");
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/png"));
      const file = new File([blob], `Buyers_Order_${form.customerName || "Customer"}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Buyers Order" });
      } else {
        alert("Sharing not supported on this device. Use Download PDF instead.");
      }
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans print:bg-white print:min-h-0">
      <style>{`
        @media print {
          @page { size: letter; margin: 0.45in; }
          body { margin: 0 !important; background: #ffffff !important; }
          .no-print { display: none !important; }
          .paper-form { width:100% !important; max-width:100% !important; padding:0 !important; margin:0 !important; box-shadow:none !important; border:none !important; background:#ffffff !important; }
        }
        .hide-buttons-for-pdf .no-print { display: none !important; }
      `}</style>

      {/* Nav */}
      <nav className="no-print bg-slate-900 fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-4 border-b border-white/5 shadow-2xl">
        <Link href="/" className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Suite</span>
        </Link>
        <div className="text-lg font-black tracking-tighter text-white uppercase italic">Buyers Order</div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleDownload} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
          </button>
          <button onClick={handleShare} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </nav>

      {/* VIN lookup bar */}
      <div className="no-print fixed top-[68px] w-full z-40 bg-slate-800 border-b border-white/10 px-4 md:px-10 py-2 flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">VIN Lookup</span>
        <input
          value={vinInput}
          onChange={e => setVinInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") lookupVehicle(); }}
          placeholder="Enter VIN to auto-fill vehicle data..."
          className="flex-1 max-w-xs bg-slate-700 border border-white/10 rounded px-3 py-1.5 text-[11px] text-white placeholder-white/30 outline-none focus:border-white/30"
        />
        <button
          onClick={lookupVehicle}
          disabled={looking}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/80 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
        >
          {looking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Load
        </button>
      </div>

      {/* Form */}
      <main className="pt-[108px] pb-16 px-4 print:pt-0 print:pb-0 print:px-0">
        <div
          ref={captureRef}
          className="paper-form bg-white text-black w-full max-w-[680px] mx-auto shadow-2xl print:max-w-none print:shadow-none"
        >
          <div className="p-6 print:p-0">
            {/* ── Dealership Header ── */}
            <div className="text-center mb-3">
              <p className="text-[13px] font-black uppercase leading-tight">RIGHT PRICE AUTO SALES, INC.</p>
              <p className="text-[11px] font-bold uppercase leading-tight">5223 NW BROAD STREET</p>
              <p className="text-[11px] font-bold uppercase leading-tight">MURFREESBORO, TN. 37129</p>
              <p className="text-[11px] font-bold uppercase leading-tight">615-893-1727</p>
            </div>

            {/* ── Title + Date ── */}
            <div className="flex justify-between items-start mb-3">
              <div className="text-[13px] font-bold uppercase tracking-widest">BUYERS ORDER</div>
              <F label="Date" value={form.date} onChange={set("date")} className="w-40" />
            </div>

            {/* ── Customer Info ── */}
            <div className="flex flex-col gap-2 mb-3">
              <F label="Customer's Name" value={form.customerName} onChange={set("customerName")} />
              <div className="flex gap-2">
                <F label="Street" value={form.street} onChange={set("street")} className="flex-[3]" />
                <F label="City" value={form.city} onChange={set("city")} className="flex-[2]" />
                <F label="St" value={form.st} onChange={set("st")} className="w-12" />
                <F label="Zip" value={form.zip} onChange={set("zip")} className="w-16" />
              </div>
            </div>

            {/* ── Unit Sold ── */}
            <div className="mb-3">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[9px] text-black">Unit Sold</span>
                <div className="flex gap-3 flex-1">
                  <F label="Year" value={form.unitYear} onChange={set("unitYear")} className="flex-1" />
                  <F label="Make" value={form.unitMake} onChange={set("unitMake")} className="flex-1" />
                  <F label="Model" value={form.unitModel} onChange={set("unitModel")} className="flex-1" />
                  <F label="Vin#" value={form.unitVin} onChange={set("unitVin")} className="flex-[2]" />
                </div>
              </div>
              <div className="flex gap-6">
                <F label="Mileage" value={form.mileage} onChange={set("mileage")} className="flex-1" />
                <F label="Color" value={form.color} onChange={set("color")} className="flex-1" />
              </div>
            </div>

            {/* ── Body: Pricing left / Trade-in right ── */}
            <div className="grid grid-cols-2 gap-6 mb-3">
              {/* Left — Pricing stack */}
              <div className="flex flex-col gap-1.5">
                <F label="Selling Price" value={form.sellingPrice} onChange={set("sellingPrice")} />
                <F label="Trade Allowance" value={form.tradeAllowance} onChange={set("tradeAllowance")} />
                <F label="Net Difference" value={form.netDifference} onChange={set("netDifference")} />
                <F label="License and Title" value={form.licenseTitle} onChange={set("licenseTitle")} />
                <F label="State Tax" value={form.stateTax} onChange={set("stateTax")} />
                <F label="Local Tax" value={form.localTax} onChange={set("localTax")} />
                <F label="Payoff on trade" value={form.payoffTrade} onChange={set("payoffTrade")} />
                <div className="h-1" />
                <F label="Subtotal" value={form.subtotal} onChange={set("subtotal")} />
                <div className="h-1" />
                <F label="Less cash received" value={form.lessCash} onChange={set("lessCash")} />
                <div className="h-1" />
                <F label="Balance Due" value={form.balanceDue} onChange={set("balanceDue")} />
              </div>

              {/* Right — Trade In + Notice */}
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase mb-1.5">TRADE IN</p>
                  <div className="flex flex-col gap-1.5">
                    <F label="Year and Make" value={form.tradeYearMake} onChange={set("tradeYearMake")} />
                    <F label="Model" value={form.tradeModel} onChange={set("tradeModel")} />
                    <F label="VIN #" value={form.tradeVin} onChange={set("tradeVin")} />
                    <F label="Mileage" value={form.tradeMileage} onChange={set("tradeMileage")} />
                  </div>
                </div>
                {/* Window form notice */}
                <div className="border border-black p-2 mt-1">
                  <p className="text-[7.5px] font-bold text-black leading-snug uppercase text-center">
                    THE INFORMATION YOU SEE ON THE WINDOW FORM FOR THE VEHICLE IS PART OF THIS CONTRACT.
                    INFORMATION IN THE WINDOW FORM OVERRIDES ANY CONTRARY PROVISIONS IN THE CONTRACT OF SALES.
                  </p>
                </div>
                {/* Approved By */}
                <div className="mt-1">
                  <F label="Approved By" value={form.approvedBy} onChange={set("approvedBy")} />
                </div>
              </div>
            </div>

            {/* ── Terms of Agreement ── */}
            <div className="mb-3">
              <p className="text-[8px] font-bold uppercase mb-1">TERMS OF AGREEMENT AND CERTIFICATION</p>
              <p className="text-[7.5px] text-black leading-snug">
                I agree to pay the balance on the terms specified and accept delivery of the vehicle within 48 hours after I have been
                notified that it is ready. In case I fail to take delivery of the vehicle when notified, my total credits may be retained as
                liquidated damages for your expense and efforts in the matter, and you may dispose of the vehicle(s) without any liability
                to me whatsoever. I certify that I am 18 years of age and hereby acknowledge receipt of copy of this order. I have read,
                understand and agree that this order includes all of the terms and conditions that this order cancels and supersedes any
                prior agreement and as of the date hereof composes the entire agreement relating to the subject matter covered hereby.
              </p>
            </div>

            {/* ── Signatures ── */}
            <div className="flex flex-col gap-2">
              <F label="Buyer's Signature" value={form.buyerSignature} onChange={set("buyerSignature")} />
              <div className="flex items-baseline gap-1">
                <span className="text-[9px] text-black whitespace-nowrap">Lien In Favor of</span>
                <div className="flex-1 border-b border-black h-4" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
