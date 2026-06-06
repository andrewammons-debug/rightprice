"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, Download, Share2, Loader2, Search } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Underline field ──────────────────────────────────────────────────────────
const F = ({
  label, value, onChange, className = "", ...rest
}: { label: string; value: string; onChange: (v: string) => void; className?: string; [k: string]: any }) => (
  <div className={`flex items-baseline gap-1 min-w-0 ${className}`}>
    <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap shrink-0">{label}</span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex-1 border-b border-black/70 bg-transparent text-[10px] font-medium text-black outline-none min-w-0 pb-px"
      {...rest}
    />
  </div>
);

const INITIAL = () => ({
  stockNo: "", year: "", make: "", model: "", miles: "", warranty: "", email: "",
  paymentType: "cash" as "cash" | "creditCard", recurringPmt: "" as "" | "yes" | "no",
  tradeYear: "", tradeMake: "", tradeModel: "", tradeMiles: "", tradeColor: "", tradeAcv: "",
  apr: "", salePrice: "", tradeAllowance: "", tip: "", downPmt: "", pickUpPmts: "",
  datePickUpPmts: "", amtRegPmt: "", pmtFreq: "" as "" | "wk" | "biwk" | "month" | "sem",
  date1stPmt: "", tagType: "" as "" | "newTag" | "transfer", county: "", registration: "",
  notes: "", salesman: "",
});

export default function DealSheet() {
  const [form, setForm] = useState(INITIAL());
  const [vinInput, setVinInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [busy, setBusy] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const set = (field: keyof ReturnType<typeof INITIAL>) => (val: any) =>
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
          year: v.year || prev.year,
          make: v.make || prev.make,
          model: v.model || prev.model,
          miles: v.miles || prev.miles,
          stockNo: v.vin || prev.stockNo,
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
      pdf.save(`Deal_Sheet_${form.stockNo || "New"}.pdf`);
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
      const file = new File([blob], `Deal_Sheet_${form.stockNo || "New"}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Sold Deal Sheet" });
      } else {
        alert("Sharing not supported on this device. Use Download PDF instead.");
      }
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  // Radio helper
  const Radio = ({ group, val, current, label, onChange }: any) => (
    <label className="flex items-center gap-0.5 cursor-pointer">
      <input
        type="radio"
        name={group}
        checked={current === val}
        onChange={() => onChange(val)}
        className="w-2.5 h-2.5 accent-black"
      />
      <span className="text-[8px] font-bold uppercase text-black">{label}</span>
    </label>
  );

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans print:bg-white print:min-h-0">
      <style>{`
        @media print {
          @page { size: letter; margin: 0.4in; }
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
        <div className="text-lg font-black tracking-tighter text-white uppercase italic">Sold Deal Sheet</div>
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
            {/* ── Title ── */}
            <h1 className="text-center text-[20px] font-black uppercase tracking-widest underline mb-4">
              SOLD DEAL SHEET
            </h1>

            {/* ── Column headers ── */}
            <div className="grid grid-cols-2 gap-6 mb-1">
              <div className="text-[11px] font-black uppercase underline">SOLD VEHICLE</div>
              <div className="flex gap-8 items-center">
                <span className="text-[11px] font-black uppercase underline">FINANCE</span>
                <span className="text-[11px] font-black uppercase underline">CASH</span>
              </div>
            </div>

            {/* ── Two columns ── */}
            <div className="grid grid-cols-2 gap-6">
              {/* LEFT — Sold Vehicle */}
              <div className="flex flex-col gap-3">
                <F label="STOCK #" value={form.stockNo} onChange={set("stockNo")} />
                <F label="YEAR" value={form.year} onChange={set("year")} />
                <F label="MAKE" value={form.make} onChange={set("make")} />
                <F label="MODEL" value={form.model} onChange={set("model")} />
                <F label="MILES" value={form.miles} onChange={set("miles")} />
                <F label="WARRANTY" value={form.warranty} onChange={set("warranty")} />
                <F label="EMAIL ADDRESS" value={form.email} onChange={set("email")} />
                <div className="h-3" />
                {/* Payment type */}
                <div className="flex items-center gap-4">
                  <Radio group="payType" val="cash" current={form.paymentType} label="CASH" onChange={set("paymentType")} />
                  <Radio group="payType" val="creditCard" current={form.paymentType} label="CREDIT CARD" onChange={set("paymentType")} />
                </div>
                {/* Recurring */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold uppercase text-black">RECURRING PMT</span>
                  <Radio group="recurPmt" val="yes" current={form.recurringPmt} label="YES" onChange={set("recurringPmt")} />
                  <Radio group="recurPmt" val="no" current={form.recurringPmt} label="NO" onChange={set("recurringPmt")} />
                </div>
                <div className="h-2" />
                {/* Trade-In */}
                <div className="text-[9px] font-black uppercase underline mb-1">TRADE-IN</div>
                <F label="YEAR" value={form.tradeYear} onChange={set("tradeYear")} />
                <F label="MAKE" value={form.tradeMake} onChange={set("tradeMake")} />
                <F label="MODEL" value={form.tradeModel} onChange={set("tradeModel")} />
                <F label="MILES" value={form.tradeMiles} onChange={set("tradeMiles")} />
                <F label="COLOR" value={form.tradeColor} onChange={set("tradeColor")} />
                <F label="ACV" value={form.tradeAcv} onChange={set("tradeAcv")} />
              </div>

              {/* RIGHT — Finance / Cash */}
              <div className="flex flex-col gap-3">
                <F label="APR" value={form.apr} onChange={set("apr")} />
                <F label="SALE PRICE" value={form.salePrice} onChange={set("salePrice")} />
                <F label="TRADE ALLOWANCE" value={form.tradeAllowance} onChange={set("tradeAllowance")} />
                <F label="*TIP" value={form.tip} onChange={set("tip")} />
                <F label="DOWN PMT" value={form.downPmt} onChange={set("downPmt")} />
                <F label="PICK UP PMTS" value={form.pickUpPmts} onChange={set("pickUpPmts")} />
                <F label="DATE OF PICK UP PMTS" value={form.datePickUpPmts} onChange={set("datePickUpPmts")} />
                {/* Amt of Reg Pmt + Frequency */}
                <div className="flex flex-col gap-1">
                  <F label="AMT OF REG PMT" value={form.amtRegPmt} onChange={set("amtRegPmt")} />
                  <div className="flex items-center gap-2 pl-1">
                    {(["wk", "biwk", "month", "sem"] as const).map(freq => (
                      <Radio key={freq} group="pmtFreq" val={freq} current={form.pmtFreq} label={freq.toUpperCase()} onChange={set("pmtFreq")} />
                    ))}
                  </div>
                </div>
                <F label="DATE OF 1ST PMT" value={form.date1stPmt} onChange={set("date1stPmt")} />
                {/* New Tag / Transfer */}
                <div className="flex items-center gap-3">
                  <span className="text-[8px] font-bold uppercase text-black">NEW TAG</span>
                  <Radio group="tagType" val="newTag" current={form.tagType} label="" onChange={set("tagType")} />
                  <span className="text-[8px] font-bold uppercase text-black">TRANSFER</span>
                  <Radio group="tagType" val="transfer" current={form.tagType} label="" onChange={set("tagType")} />
                </div>
                <F label="COUNTY" value={form.county} onChange={set("county")} />
                <div className="flex items-baseline gap-1">
                  <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">REGISTRATION</span>
                  <input
                    value={form.registration}
                    onChange={e => set("registration")(e.target.value)}
                    className="w-16 border-b border-black/70 bg-transparent text-[10px] font-medium text-black outline-none pb-px"
                  />
                  <span className="text-[8px] font-bold text-black">T</span>
                </div>
                <div className="h-2" />
                {/* Notes */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold uppercase text-black">NOTES</span>
                  <input value={form.notes} onChange={e => set("notes")(e.target.value)}
                    className="border-b border-black/70 bg-transparent text-[10px] text-black outline-none pb-px w-full" />
                  <div className="border-b border-black/40 h-4 w-full" />
                  <div className="border-b border-black/40 h-4 w-full" />
                </div>
                <F label="SALESMAN" value={form.salesman} onChange={set("salesman")} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
