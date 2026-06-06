"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Printer, Download, Share2,
  Loader2, RotateCcw, Search, Pencil,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Shared primitives ────────────────────────────────────────────────────────

const F = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-col min-w-0 justify-center h-full">
    <span className="text-[5.5px] font-bold uppercase text-black leading-none">{label}</span>
    <input value={value} onChange={e => onChange(e.target.value)}
      className="border-b border-black/60 bg-transparent text-[9px] font-medium text-black outline-none w-full min-w-0 mt-[1px]" />
  </div>
);

const Cell = ({ children, right = false, noBorderB: _noBorderB = false }: {
  children: React.ReactNode; right?: boolean; noBorderB?: boolean;
}) => (
  <div className={["p-[3px] min-w-0 flex flex-col justify-center",
    right ? "" : "border-r border-black"].join(" ")}>
    {children}
  </div>
);

const Fd = ({ label, value, onChange, w, lw }: {
  label?: string; value: string; onChange: (v: string) => void; w?: string; lw?: string;
}) => (
  <div className={`flex items-baseline gap-[3px] min-w-0 ${w ? "" : "flex-1"}`} style={w ? { width: w } : {}}>
    {label && <span className="text-[8px] text-black font-normal whitespace-nowrap shrink-0" style={lw ? { minWidth: lw } : {}}>{label}</span>}
    <div className="border-b border-black flex-1 min-w-0">
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-[9px] text-black outline-none leading-none" />
    </div>
  </div>
);

const Row = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex items-center" style={{ flex: 1, minHeight: 0 }}>{children}</div>
);

// Module-level — must NOT be defined inside a component or React remounts on every keystroke
const BR = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex items-center py-[3px]">{children}</div>
);

const Radio = ({ group, val, current, label, onChange }: {
  group: string; val: string; current: string; label: string; onChange: (v: string) => void;
}) => (
  <label className="flex items-center gap-[3px] cursor-pointer">
    <input type="radio" name={group} checked={current === val} onChange={() => onChange(val)}
      className="w-2.5 h-2.5 accent-black shrink-0" />
    <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">{label}</span>
  </label>
);

// ─── Per-slide controls bar ───────────────────────────────────────────────────

function SlideControls({ margin, onMarginChange, onClear, onPrint, onDownload, onShare, busy,
  vinInput, onVinChange, onVinLookup, looking }: {
  margin: number; onMarginChange: (m: number) => void;
  onClear: () => void; onPrint: () => void; onDownload: () => void; onShare: () => void;
  busy: boolean; vinInput?: string; onVinChange?: (v: string) => void;
  onVinLookup?: () => void; looking?: boolean;
}) {
  return (
    <div className="slide-controls bg-slate-800 border-b border-white/10 px-3 py-1.5 flex flex-wrap items-center gap-2 shrink-0">
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded border border-white/10">
        <button onClick={() => onMarginChange(Math.max(0.25, parseFloat((margin - 0.25).toFixed(2))))}
          className="text-white/60 hover:text-white w-4 text-center font-bold">−</button>
        <span className="text-[9px] text-white/70 w-6 text-center tabular-nums">{margin}"</span>
        <button onClick={() => onMarginChange(Math.min(1.0, parseFloat((margin + 0.25).toFixed(2))))}
          className="text-white/60 hover:text-white w-4 text-center font-bold">+</button>
        <span className="text-[8px] text-white/30 uppercase ml-0.5">margin</span>
      </div>
      {vinInput !== undefined && (
        <>
          <input value={vinInput} onChange={e => onVinChange?.(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onVinLookup?.(); }}
            placeholder="VIN lookup…"
            className="w-44 bg-slate-700 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder-white/30 outline-none" />
          <button onClick={onVinLookup} disabled={looking}
            className="flex items-center gap-1 px-2 py-1 bg-primary hover:bg-primary/80 text-white text-[9px] font-bold rounded disabled:opacity-50">
            {looking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          </button>
        </>
      )}
      <button onClick={onClear} className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-red-900 text-white text-[9px] font-bold uppercase rounded transition-colors">
        <RotateCcw className="w-3 h-3" /> Clear
      </button>
      <button onClick={onPrint} className="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-[9px] font-bold uppercase rounded transition-colors">
        <Printer className="w-3 h-3" /> Print
      </button>
      <button onClick={onDownload} disabled={busy} className="flex items-center gap-1 px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-bold uppercase rounded disabled:opacity-50 transition-colors">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
      </button>
      <button onClick={onShare} disabled={busy} className="flex items-center gap-1 px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-bold uppercase rounded disabled:opacity-50 transition-colors">
        <Share2 className="w-3 h-3" /> Share
      </button>
    </div>
  );
}

// ─── Slide 1: Heritage South Express App ─────────────────────────────────────

const BHS = () => ({ amt:"",name:"",ssn:"",dob:"",phone:"",work:"",email:"",addr:"",city:"",st:"",zip:"",yrs:"",rentMortg:"",rentAmt:"",prevAddr:"",prevCity:"",prevSt:"",prevZip:"",prevYrs:"",prevRent:"",prevAmt:"",emp:"",empStr:"",empCity:"",empSt:"",empZip:"",pos:"",gross:"",yrsEmp:"",prevEmp:"",prevYrsEmp:"",carPmt:"",carTo:"",sig:"",sigDate:"",coName:"",coSsn:"",coDob:"",coPhone:"",coWork:"",coEmail:"",coAddr:"",coCity:"",coSt:"",coZip:"",coYrs:"",coRentMortg:"",coRentAmt:"",coPrevAddr:"",coPrevCity:"",coPrevSt:"",coPrevZip:"",coPrevYrs:"",coPrevRent:"",coPrevAmt:"",coEmp:"",coEmpStr:"",coEmpCity:"",coEmpSt:"",coEmpZip:"",coPos:"",coGross:"",coYrsEmp:"",coPrevEmp:"",coPrevYrsEmp:"",coCarPmt:"",coCarTo:"",coSig:"",coSigDate:"" });

function HSSlide({ isActive, margin, onMarginChange }: { isActive: boolean; margin: number; onMarginChange: (m: number) => void }) {
  const [d, setD] = useState(BHS());
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = (f: string) => (v: string) => setD(p => ({ ...p, [f]: v }));
  const pageH = `calc(11in - ${(margin * 2).toFixed(2)}in)`;

  const capture = async (scale = 2) => {
    if (!ref.current) return null;
    const c = await html2canvas(ref.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
    return c;
  };
  const handleDownload = async () => {
    setBusy(true);
    try {
      const c = await capture(2); if (!c) return;
      const pdf = new jsPDF("p","mm","letter");
      pdf.addImage(c.toDataURL("image/png",1.0),"PNG",0,0,pdf.internal.pageSize.getWidth(),pdf.internal.pageSize.getHeight(),undefined,"FAST");
      pdf.save(`Express_HS_${d.name||"Applicant"}.pdf`);
    } finally { setBusy(false); }
  };
  const handleShare = async () => {
    setBusy(true);
    try {
      const c = await capture(1.5); if (!c) return;
      const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!),"image/png"));
      const file = new File([blob],`Express_HS_${d.name||"App"}.png`,{type:"image/png"});
      if (navigator.canShare?.({files:[file]})) await navigator.share({files:[file],title:"Express Application"});
      else alert("Use Download PDF to save.");
    } finally { setBusy(false); }
  };

  return (
    <div className={`slide${isActive ? " active" : ""}`}
      style={{ minWidth:"100vw", height:"100%", overflowY:"auto", scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
      <SlideControls margin={margin} onMarginChange={onMarginChange}
        onClear={() => { if (confirm("Clear all fields?")) setD(BHS()); }}
        onPrint={() => window.print()} onDownload={handleDownload} onShare={handleShare} busy={busy} />
      <div className="form-wrapper py-4 px-4 flex justify-center bg-slate-950 flex-1" style={{ overflowX:"auto" }}>
        <div ref={ref} className="paper-form express-paper bg-white text-black border-2 border-black shadow-lg"
          style={{ width:"7.5in", minHeight: pageH, display:"flex", flexDirection:"column", fontFamily:"Arial, sans-serif" }}>
          <div className="flex items-stretch border-b-2 border-black flex-none">
            <div className="flex-1 p-2 border-r-2 border-black">
              <div className="text-[16px] font-black uppercase tracking-wide leading-none">EXPRESS APPLICATION</div>
              <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5 leading-none">APLICACIÓN RÁPIDA</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-[7px] font-bold uppercase whitespace-nowrap">AMOUNT REQUESTED / CANTIDAD SOLICITADA:</span>
                <input value={d.amt} onChange={e => s("amt")(e.target.value)} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none flex-1 min-w-0" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-2 min-w-[130px]">
              <div className="text-[17px] font-black leading-none" style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>Heritage</div>
              <div className="flex items-center gap-1 leading-none mt-[1px]">
                <span className="text-[8px]">🌿</span>
                <div className="text-[15px] font-black tracking-wider" style={{ fontFamily:"Georgia,serif" }}>South</div>
                <span className="text-[8px]">🌿</span>
              </div>
              <div className="text-[6px] font-black tracking-widest uppercase mt-0.5 text-center leading-tight">COMMUNITY CREDIT UNION</div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-black flex-none">
            <div className="p-[3px] border-r border-black text-[7px] font-black uppercase tracking-widest">APPLICANT</div>
            <div className="p-[3px] text-[7px] font-black uppercase tracking-widest">CO-APPLICANT</div>
          </div>
          <div className="grid grid-cols-2" style={{ flex:1, gridAutoRows:"1fr" }}>
            <Cell><F label="APPLICANT'S NAME / NOMBRE DE PRESTATARIO" value={d.name} onChange={s("name")} /></Cell>
            <Cell right><F label="CO-APPLICANT'S NAME / NOMBRE DE CO-PRESTATARIO" value={d.coName} onChange={s("coName")} /></Cell>
            <Cell><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="SSN/ITIN" value={d.ssn} onChange={s("ssn")} /></div><div className="pl-1 flex flex-col justify-center"><F label="DATE OF BIRTH" value={d.dob} onChange={s("dob")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="SSN/ITIN" value={d.coSsn} onChange={s("coSsn")} /></div><div className="pl-1 flex flex-col justify-center"><F label="DATE OF BIRTH" value={d.coDob} onChange={s("coDob")} /></div></div></Cell>
            <Cell><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="PHONE" value={d.phone} onChange={s("phone")} /></div><div className="pl-1 flex flex-col justify-center"><F label="WORK NUMBER" value={d.work} onChange={s("work")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="PHONE" value={d.coPhone} onChange={s("coPhone")} /></div><div className="pl-1 flex flex-col justify-center"><F label="WORK NUMBER" value={d.coWork} onChange={s("coWork")} /></div></div></Cell>
            <Cell><F label="EMAIL ADDRESS / CORREO ELECTRÓNICO" value={d.email} onChange={s("email")} /></Cell>
            <Cell right><F label="EMAIL ADDRESS / CORREO ELECTRÓNICO" value={d.coEmail} onChange={s("coEmail")} /></Cell>
            <Cell><F label="STREET ADDRESS / DIRECCIÓN" value={d.addr} onChange={s("addr")} /></Cell>
            <Cell right><F label="STREET ADDRESS / DIRECCIÓN" value={d.coAddr} onChange={s("coAddr")} /></Cell>
            <Cell><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY" value={d.city} onChange={s("city")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.st} onChange={s("st")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.zip} onChange={s("zip")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY" value={d.coCity} onChange={s("coCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.coSt} onChange={s("coSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.coZip} onChange={s("coZip")} /></div></div></Cell>
            <Cell><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE" value={d.yrs} onChange={s("yrs")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR MORTG?" value={d.rentMortg} onChange={s("rentMortg")} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT" value={d.rentAmt} onChange={s("rentAmt")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE" value={d.coYrs} onChange={s("coYrs")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR MORTG?" value={d.coRentMortg} onChange={s("coRentMortg")} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT" value={d.coRentAmt} onChange={s("coRentAmt")} /></div></div></Cell>
            <Cell><F label="PREVIOUS ADDRESS (IF CURRENT < 2 YRS)" value={d.prevAddr} onChange={s("prevAddr")} /></Cell>
            <Cell right><F label="PREVIOUS ADDRESS (IF CURRENT < 2 YRS)" value={d.coPrevAddr} onChange={s("coPrevAddr")} /></Cell>
            <Cell><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY" value={d.prevCity} onChange={s("prevCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.prevSt} onChange={s("prevSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.prevZip} onChange={s("prevZip")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY" value={d.coPrevCity} onChange={s("coPrevCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.coPrevSt} onChange={s("coPrevSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.coPrevZip} onChange={s("coPrevZip")} /></div></div></Cell>
            <Cell><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT PREV RESIDENCE" value={d.prevYrs} onChange={s("prevYrs")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR OWN?" value={d.prevRent} onChange={s("prevRent")} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT" value={d.prevAmt} onChange={s("prevAmt")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT PREV RESIDENCE" value={d.coPrevYrs} onChange={s("coPrevYrs")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR OWN?" value={d.coPrevRent} onChange={s("coPrevRent")} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT" value={d.coPrevAmt} onChange={s("coPrevAmt")} /></div></div></Cell>
            <Cell><F label="EMPLOYER (OR SOURCE OF INCOME)" value={d.emp} onChange={s("emp")} /></Cell>
            <Cell right><F label="EMPLOYER (OR SOURCE OF INCOME)" value={d.coEmp} onChange={s("coEmp")} /></Cell>
            <Cell><div className="grid grid-cols-[2fr_2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="STREET" value={d.empStr} onChange={s("empStr")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="CITY" value={d.empCity} onChange={s("empCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="ST" value={d.empSt} onChange={s("empSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.empZip} onChange={s("empZip")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="STREET" value={d.coEmpStr} onChange={s("coEmpStr")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="CITY" value={d.coEmpCity} onChange={s("coEmpCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="ST" value={d.coEmpSt} onChange={s("coEmpSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.coEmpZip} onChange={s("coEmpZip")} /></div></div></Cell>
            <Cell><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="POSITION/TITLE" value={d.pos} onChange={s("pos")} /></div><div className="pl-1 flex flex-col justify-center"><F label="GROSS INCOME (FREQUENCY)" value={d.gross} onChange={s("gross")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="POSITION/TITLE" value={d.coPos} onChange={s("coPos")} /></div><div className="pl-1 flex flex-col justify-center"><F label="GROSS INCOME (FREQUENCY)" value={d.coGross} onChange={s("coGross")} /></div></div></Cell>
            <Cell><F label="YRS/MOS OF EMPLOYMENT" value={d.yrsEmp} onChange={s("yrsEmp")} /></Cell>
            <Cell right><F label="YRS/MOS OF EMPLOYMENT" value={d.coYrsEmp} onChange={s("coYrsEmp")} /></Cell>
            <Cell><F label="PREVIOUS EMPLOYER (IF CURRENT < 2 YRS)" value={d.prevEmp} onChange={s("prevEmp")} /></Cell>
            <Cell right><F label="PREVIOUS EMPLOYER (IF CURRENT < 2 YRS)" value={d.coPrevEmp} onChange={s("coPrevEmp")} /></Cell>
            <Cell><F label="YRS/MOS OF EMPLOYMENT" value={d.prevYrsEmp} onChange={s("prevYrsEmp")} /></Cell>
            <Cell right><F label="YRS/MOS OF EMPLOYMENT" value={d.coPrevYrsEmp} onChange={s("coPrevYrsEmp")} /></Cell>
            <Cell noBorderB><div className="grid grid-cols-[3fr_2fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="MONTHLY CAR PAYMENT(S)" value={d.carPmt} onChange={s("carPmt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="TO WHOM?" value={d.carTo} onChange={s("carTo")} /></div></div></Cell>
            <Cell right noBorderB><div className="grid grid-cols-[3fr_2fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="MONTHLY CAR PAYMENT(S)" value={d.coCarPmt} onChange={s("coCarPmt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="TO WHOM?" value={d.coCarTo} onChange={s("coCarTo")} /></div></div></Cell>
          </div>
          <div className="grid grid-cols-2 border-t-2 border-black flex-none">
            <div className="border-r border-black p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div><div className="text-[6px] font-black uppercase leading-none">APPLICANT'S SIGNATURE / FIRMA</div><input value={d.sig} onChange={e => s("sig")(e.target.value)} className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" /></div>
              <div><div className="text-[6px] font-black uppercase leading-none">DATE</div><input value={d.sigDate} onChange={e => s("sigDate")(e.target.value)} className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" /></div>
            </div>
            <div className="p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div><div className="text-[6px] font-black uppercase leading-none">CO-APPLICANT'S SIGNATURE / FIRMA</div><input value={d.coSig} onChange={e => s("coSig")(e.target.value)} className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" /></div>
              <div><div className="text-[6px] font-black uppercase leading-none">DATE</div><input value={d.coSigDate} onChange={e => s("coSigDate")(e.target.value)} className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" /></div>
            </div>
          </div>
          <div className="border-t border-black p-2 text-[6.5px] leading-snug text-black flex-none">
            <p className="font-semibold">I hereby authorize Heritage South Community Credit Union to request my credit report from a credit reporting agency.</p>
            <p className="mt-0.5">Autorizo a Heritage South Community Credit Union que solicite mi reporte de crédito de una agencia de crédito.</p>
            <div className="grid grid-cols-2 gap-x-6 mt-1 text-[6px]">
              <div>HSCCU Shelbyville — loan@heritagesouth.org</div><div>HSCCU Lewisburg — Email-LewisburLenders@heritagesouth.org</div>
              <div>HSCCU Manchester — EMAIL-MANCHESTER@heritagesouth.org</div><div>HSCCU Fayetteville — EMAIL-FAYETTEVILLE@heritagesouth.org</div>
              <div>HSCCU Smyrna — EMAIL-SMYRNA@heritagesouth.org</div><div>HSCCU MLK — EMAIL-MERCURY@heritagesouth.org</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slide 2: Generic Lender Express App ─────────────────────────────────────

const BGA = () => ({ amt:"",name:"",ssn:"",dob:"",phone:"",work:"",email:"",addr:"",city:"",st:"",zip:"",yrs:"",rentMortg:"",rentAmt:"",prevAddr:"",prevCity:"",prevSt:"",prevZip:"",prevYrs:"",prevRent:"",prevAmt:"",emp:"",empStr:"",empCity:"",empSt:"",empZip:"",pos:"",gross:"",yrsEmp:"",prevEmp:"",prevYrsEmp:"",carPmt:"",carTo:"",sig:"",sigDate:"",coName:"",coSsn:"",coDob:"",coPhone:"",coWork:"",coEmail:"",coAddr:"",coCity:"",coSt:"",coZip:"",coYrs:"",coRentMortg:"",coRentAmt:"",coPrevAddr:"",coPrevCity:"",coPrevSt:"",coPrevZip:"",coPrevYrs:"",coPrevRent:"",coPrevAmt:"",coEmp:"",coEmpStr:"",coEmpCity:"",coEmpSt:"",coEmpZip:"",coPos:"",coGross:"",coYrsEmp:"",coPrevEmp:"",coPrevYrsEmp:"",coCarPmt:"",coCarTo:"",coSig:"",coSigDate:"" });

function GASlide({ isActive, margin, onMarginChange }: { isActive: boolean; margin: number; onMarginChange: (m: number) => void }) {
  const [d, setD] = useState(BGA());
  const [lender, setLender] = useState("");
  const [editingLender, setEditingLender] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = (f: string) => (v: string) => setD(p => ({ ...p, [f]: v }));
  const displayLender = lender.trim() || "LENDER NAME";
  const pageH = `calc(11in - ${(margin * 2).toFixed(2)}in)`;

  const capture = async (scale = 2) => {
    if (!ref.current) return null;
    ref.current.classList.add("hide-lender-hint");
    const c = await html2canvas(ref.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
    ref.current.classList.remove("hide-lender-hint");
    return c;
  };
  const handleDownload = async () => {
    setBusy(true);
    try {
      const c = await capture(2); if (!c) return;
      const pdf = new jsPDF("p","mm","letter");
      pdf.addImage(c.toDataURL("image/png",1.0),"PNG",0,0,pdf.internal.pageSize.getWidth(),pdf.internal.pageSize.getHeight(),undefined,"FAST");
      pdf.save(`Express_App_${lender||"Lender"}_${d.name||"Applicant"}.pdf`);
    } finally { setBusy(false); }
  };
  const handleShare = async () => {
    setBusy(true);
    try {
      const c = await capture(1.5); if (!c) return;
      const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!),"image/png"));
      const file = new File([blob],`Express_App_${d.name||"App"}.png`,{type:"image/png"});
      if (navigator.canShare?.({files:[file]})) await navigator.share({files:[file],title:"Express Application"});
      else alert("Use Download PDF to save.");
    } finally { setBusy(false); }
  };

  return (
    <div className={`slide${isActive ? " active" : ""}`}
      style={{ minWidth:"100vw", height:"100%", overflowY:"auto", scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
      <SlideControls margin={margin} onMarginChange={onMarginChange}
        onClear={() => { if (confirm("Clear all fields?")) { setD(BGA()); setLender(""); } }}
        onPrint={() => window.print()} onDownload={handleDownload} onShare={handleShare} busy={busy} />
      <div className="form-wrapper py-4 px-4 flex justify-center bg-slate-950 flex-1" style={{ overflowX:"auto" }}>
        <div ref={ref} className="paper-form express-paper bg-white text-black border-2 border-black shadow-lg"
          style={{ width:"7.5in", minHeight: pageH, display:"flex", flexDirection:"column", fontFamily:"Arial, sans-serif" }}>
          <div className="flex items-stretch border-b-2 border-black flex-none">
            <div className="flex-1 p-2 border-r-2 border-black">
              <div className="text-[16px] font-black uppercase tracking-wide leading-none">EXPRESS APPLICATION</div>
              <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5 leading-none">APLICACIÓN RÁPIDA</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-[7px] font-bold uppercase whitespace-nowrap">AMOUNT REQUESTED / CANTIDAD SOLICITADA:</span>
                <input value={d.amt} onChange={e => s("amt")(e.target.value)} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none flex-1 min-w-0" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-2 min-w-[130px]">
              {editingLender ? (
                <div className="flex flex-col items-center w-full gap-1">
                  <input autoFocus value={lender} onChange={e => setLender(e.target.value)}
                    onBlur={() => setEditingLender(false)}
                    onKeyDown={e => { if (e.key === "Enter") setEditingLender(false); }}
                    placeholder="Lender name..."
                    className="text-[11px] font-black text-center w-full bg-transparent outline-none border-b border-black text-black placeholder-black/30" />
                  <span className="text-[6px] text-black/40 uppercase">Enter to confirm</span>
                </div>
              ) : (
                <div className="cursor-pointer text-center w-full group" onClick={() => setEditingLender(true)}>
                  <div className={`text-[14px] font-black leading-tight ${!lender ? "text-black/30" : "text-black"}`}
                    style={{ fontFamily:"Georgia,serif", fontStyle: lender ? "italic" : "normal" }}>
                    {displayLender}
                  </div>
                  <div className="lender-hint mt-0.5 flex items-center justify-center gap-0.5 text-[6px] font-bold uppercase text-black/25 group-hover:text-black/50 transition-colors">
                    <Pencil className="w-2 h-2" /> click to edit
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-black flex-none">
            <div className="p-[3px] border-r border-black text-[7px] font-black uppercase tracking-widest">APPLICANT</div>
            <div className="p-[3px] text-[7px] font-black uppercase tracking-widest">CO-APPLICANT</div>
          </div>
          <div className="grid grid-cols-2" style={{ flex:1, gridAutoRows:"1fr" }}>
            <Cell><F label="APPLICANT'S NAME / NOMBRE DE PRESTATARIO" value={d.name} onChange={s("name")} /></Cell>
            <Cell right><F label="CO-APPLICANT'S NAME / NOMBRE DE CO-PRESTATARIO" value={d.coName} onChange={s("coName")} /></Cell>
            <Cell><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="SSN/ITIN" value={d.ssn} onChange={s("ssn")} /></div><div className="pl-1 flex flex-col justify-center"><F label="DATE OF BIRTH" value={d.dob} onChange={s("dob")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="SSN/ITIN" value={d.coSsn} onChange={s("coSsn")} /></div><div className="pl-1 flex flex-col justify-center"><F label="DATE OF BIRTH" value={d.coDob} onChange={s("coDob")} /></div></div></Cell>
            <Cell><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="PHONE" value={d.phone} onChange={s("phone")} /></div><div className="pl-1 flex flex-col justify-center"><F label="WORK NUMBER" value={d.work} onChange={s("work")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="PHONE" value={d.coPhone} onChange={s("coPhone")} /></div><div className="pl-1 flex flex-col justify-center"><F label="WORK NUMBER" value={d.coWork} onChange={s("coWork")} /></div></div></Cell>
            <Cell><F label="EMAIL ADDRESS / CORREO ELECTRÓNICO" value={d.email} onChange={s("email")} /></Cell>
            <Cell right><F label="EMAIL ADDRESS / CORREO ELECTRÓNICO" value={d.coEmail} onChange={s("coEmail")} /></Cell>
            <Cell><F label="STREET ADDRESS / DIRECCIÓN" value={d.addr} onChange={s("addr")} /></Cell>
            <Cell right><F label="STREET ADDRESS / DIRECCIÓN" value={d.coAddr} onChange={s("coAddr")} /></Cell>
            <Cell><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY" value={d.city} onChange={s("city")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.st} onChange={s("st")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.zip} onChange={s("zip")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY" value={d.coCity} onChange={s("coCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.coSt} onChange={s("coSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.coZip} onChange={s("coZip")} /></div></div></Cell>
            <Cell><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE" value={d.yrs} onChange={s("yrs")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR MORTG?" value={d.rentMortg} onChange={s("rentMortg")} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT" value={d.rentAmt} onChange={s("rentAmt")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE" value={d.coYrs} onChange={s("coYrs")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR MORTG?" value={d.coRentMortg} onChange={s("coRentMortg")} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT" value={d.coRentAmt} onChange={s("coRentAmt")} /></div></div></Cell>
            <Cell><F label="PREVIOUS ADDRESS (IF CURRENT < 2 YRS)" value={d.prevAddr} onChange={s("prevAddr")} /></Cell>
            <Cell right><F label="PREVIOUS ADDRESS (IF CURRENT < 2 YRS)" value={d.coPrevAddr} onChange={s("coPrevAddr")} /></Cell>
            <Cell><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY" value={d.prevCity} onChange={s("prevCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.prevSt} onChange={s("prevSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.prevZip} onChange={s("prevZip")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY" value={d.coPrevCity} onChange={s("coPrevCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.coPrevSt} onChange={s("coPrevSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.coPrevZip} onChange={s("coPrevZip")} /></div></div></Cell>
            <Cell><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT PREV RESIDENCE" value={d.prevYrs} onChange={s("prevYrs")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR OWN?" value={d.prevRent} onChange={s("prevRent")} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT" value={d.prevAmt} onChange={s("prevAmt")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT PREV RESIDENCE" value={d.coPrevYrs} onChange={s("coPrevYrs")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR OWN?" value={d.coPrevRent} onChange={s("coPrevRent")} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT" value={d.coPrevAmt} onChange={s("coPrevAmt")} /></div></div></Cell>
            <Cell><F label="EMPLOYER (OR SOURCE OF INCOME)" value={d.emp} onChange={s("emp")} /></Cell>
            <Cell right><F label="EMPLOYER (OR SOURCE OF INCOME)" value={d.coEmp} onChange={s("coEmp")} /></Cell>
            <Cell><div className="grid grid-cols-[2fr_2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="STREET" value={d.empStr} onChange={s("empStr")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="CITY" value={d.empCity} onChange={s("empCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="ST" value={d.empSt} onChange={s("empSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.empZip} onChange={s("empZip")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-[2fr_2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="STREET" value={d.coEmpStr} onChange={s("coEmpStr")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="CITY" value={d.coEmpCity} onChange={s("coEmpCity")} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="ST" value={d.coEmpSt} onChange={s("coEmpSt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.coEmpZip} onChange={s("coEmpZip")} /></div></div></Cell>
            <Cell><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="POSITION/TITLE" value={d.pos} onChange={s("pos")} /></div><div className="pl-1 flex flex-col justify-center"><F label="GROSS INCOME (FREQUENCY)" value={d.gross} onChange={s("gross")} /></div></div></Cell>
            <Cell right><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="POSITION/TITLE" value={d.coPos} onChange={s("coPos")} /></div><div className="pl-1 flex flex-col justify-center"><F label="GROSS INCOME (FREQUENCY)" value={d.coGross} onChange={s("coGross")} /></div></div></Cell>
            <Cell><F label="YRS/MOS OF EMPLOYMENT" value={d.yrsEmp} onChange={s("yrsEmp")} /></Cell>
            <Cell right><F label="YRS/MOS OF EMPLOYMENT" value={d.coYrsEmp} onChange={s("coYrsEmp")} /></Cell>
            <Cell><F label="PREVIOUS EMPLOYER (IF CURRENT < 2 YRS)" value={d.prevEmp} onChange={s("prevEmp")} /></Cell>
            <Cell right><F label="PREVIOUS EMPLOYER (IF CURRENT < 2 YRS)" value={d.coPrevEmp} onChange={s("coPrevEmp")} /></Cell>
            <Cell><F label="YRS/MOS OF EMPLOYMENT" value={d.prevYrsEmp} onChange={s("prevYrsEmp")} /></Cell>
            <Cell right><F label="YRS/MOS OF EMPLOYMENT" value={d.coPrevYrsEmp} onChange={s("coPrevYrsEmp")} /></Cell>
            <Cell noBorderB><div className="grid grid-cols-[3fr_2fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="MONTHLY CAR PAYMENT(S)" value={d.carPmt} onChange={s("carPmt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="TO WHOM?" value={d.carTo} onChange={s("carTo")} /></div></div></Cell>
            <Cell right noBorderB><div className="grid grid-cols-[3fr_2fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="MONTHLY CAR PAYMENT(S)" value={d.coCarPmt} onChange={s("coCarPmt")} /></div><div className="pl-1 flex flex-col justify-center"><F label="TO WHOM?" value={d.coCarTo} onChange={s("coCarTo")} /></div></div></Cell>
          </div>
          <div className="grid grid-cols-2 border-t-2 border-black flex-none">
            <div className="border-r border-black p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div><div className="text-[6px] font-black uppercase leading-none">APPLICANT'S SIGNATURE / FIRMA</div><input value={d.sig} onChange={e => s("sig")(e.target.value)} className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" /></div>
              <div><div className="text-[6px] font-black uppercase leading-none">DATE</div><input value={d.sigDate} onChange={e => s("sigDate")(e.target.value)} className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" /></div>
            </div>
            <div className="p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div><div className="text-[6px] font-black uppercase leading-none">CO-APPLICANT'S SIGNATURE / FIRMA</div><input value={d.coSig} onChange={e => s("coSig")(e.target.value)} className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" /></div>
              <div><div className="text-[6px] font-black uppercase leading-none">DATE</div><input value={d.coSigDate} onChange={e => s("coSigDate")(e.target.value)} className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" /></div>
            </div>
          </div>
          <div className="border-t border-black p-2 text-[6.5px] leading-snug text-black flex-none">
            <p className="font-semibold">I hereby authorize {displayLender} to request my credit report from a credit reporting agency.</p>
            <p className="mt-0.5">Autorizo a {displayLender} que solicite mi reporte de crédito de una agencia de crédito.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slide 3: Deal Sheet ──────────────────────────────────────────────────────

const BDS = () => ({ stockNo:"",year:"",make:"",model:"",miles:"",warranty:"",email:"",paymentType:"" as ""|"cash"|"creditCard",recurringPmt:"" as ""|"yes"|"no",tradeYear:"",tradeMake:"",tradeModel:"",tradeMiles:"",tradeColor:"",tradeAcv:"",apr:"",salePrice:"",tradeAllowance:"",tip:"",downPmt:"",pickUpPmts:"",datePickUpPmts:"",amtRegPmt:"",pmtFreq:"" as ""|"wk"|"biwk"|"month"|"sem",date1stPmt:"",tagType:"" as ""|"newTag"|"transfer",county:"",registration:"",notes:"",notes2:"",salesman:"" });

function DSSlide({ isActive, margin, onMarginChange }: { isActive: boolean; margin: number; onMarginChange: (m: number) => void }) {
  const [form, setForm] = useState(BDS());
  const [vinInput, setVinInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const set = (f: keyof ReturnType<typeof BDS>) => (v: any) => setForm(p => ({ ...p, [f]: v }));
  const pageH = `calc(11in - ${(margin * 2).toFixed(2)}in)`;

  const lookupVehicle = async () => {
    const q = vinInput.trim(); if (!q) return;
    setLooking(true);
    try {
      const res = await fetch(`/api/inspection?vin=${encodeURIComponent(q)}`);
      const data = await res.json();
      const v = Array.isArray(data) && data[0];
      if (v) setForm(p => ({ ...p, year:v.year||p.year, make:v.make||p.make, model:v.model||p.model, miles:v.miles||p.miles, stockNo:v.vin||p.stockNo }));
      else alert("No vehicle found.");
    } catch { alert("Lookup failed."); }
    finally { setLooking(false); }
  };
  const capture = async (scale = 2) => {
    if (!ref.current) return null;
    return await html2canvas(ref.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
  };
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
    <div className={`slide${isActive ? " active" : ""}`}
      style={{ minWidth:"100vw", height:"100%", overflowY:"auto", scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
      <SlideControls margin={margin} onMarginChange={onMarginChange}
        onClear={() => { if (confirm("Clear all fields?")) setForm(BDS()); }}
        onPrint={() => window.print()} onDownload={handleDownload} onShare={handleShare} busy={busy}
        vinInput={vinInput} onVinChange={setVinInput} onVinLookup={lookupVehicle} looking={looking} />
      <div className="form-wrapper py-4 px-4 flex justify-center bg-slate-950 flex-1">
        <div ref={ref} className="paper-form bg-white text-black border-2 border-black shadow-lg"
          style={{ width:"7.5in", minHeight: pageH, display:"flex", flexDirection:"column", fontFamily:"Arial, sans-serif" }}>
          <div className="border-b-2 border-black text-center py-1 flex-none">
            <span className="text-[17px] font-black uppercase tracking-[0.2em] underline">SOLD DEAL SHEET</span>
          </div>
          <div className="grid grid-cols-2 border-b border-black flex-none">
            <div className="px-2 py-[2px] border-r-2 border-black text-[9px] font-black uppercase underline">SOLD VEHICLE</div>
            <div className="px-2 py-[2px] flex items-center gap-8">
              <span className="text-[9px] font-black uppercase underline">FINANCE</span>
              <span className="text-[9px] font-black uppercase underline">CASH</span>
            </div>
          </div>
          <div className="grid grid-cols-2" style={{ flex:1 }}>
            <div className="border-r-2 border-black px-2 flex flex-col" style={{ flex:1 }}>
              <Row><Fd label="STOCK #" value={form.stockNo} onChange={set("stockNo")} /></Row>
              <Row><Fd label="YEAR" value={form.year} onChange={set("year")} /></Row>
              <Row><Fd label="MAKE" value={form.make} onChange={set("make")} /></Row>
              <Row><Fd label="MODEL" value={form.model} onChange={set("model")} /></Row>
              <Row><Fd label="MILES" value={form.miles} onChange={set("miles")} /></Row>
              <Row><Fd label="WARRANTY" value={form.warranty} onChange={set("warranty")} /></Row>
              <Row><Fd label="EMAIL ADDRESS" value={form.email} onChange={set("email")} /></Row>
              <Row><div className="flex items-center gap-4"><Radio group="sl-pay" val="cash" current={form.paymentType} label="CASH" onChange={set("paymentType")} /><Radio group="sl-pay" val="creditCard" current={form.paymentType} label="CREDIT CARD" onChange={set("paymentType")} /></div></Row>
              <Row><div className="flex items-center gap-2"><span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">RECURRING PMT:</span><Radio group="sl-recur" val="yes" current={form.recurringPmt} label="YES" onChange={set("recurringPmt")} /><Radio group="sl-recur" val="no" current={form.recurringPmt} label="NO" onChange={set("recurringPmt")} /></div></Row>
              <Row />
              <Row><span className="text-[8px] font-black uppercase underline text-black">TRADE-IN</span></Row>
              <Row><Fd label="YEAR" value={form.tradeYear} onChange={set("tradeYear")} /></Row>
              <Row><Fd label="MAKE" value={form.tradeMake} onChange={set("tradeMake")} /></Row>
              <Row><Fd label="MODEL" value={form.tradeModel} onChange={set("tradeModel")} /></Row>
              <Row><Fd label="MILES" value={form.tradeMiles} onChange={set("tradeMiles")} /></Row>
              <Row><Fd label="COLOR" value={form.tradeColor} onChange={set("tradeColor")} /></Row>
              <Row><Fd label="ACV" value={form.tradeAcv} onChange={set("tradeAcv")} /></Row>
            </div>
            <div className="px-2 flex flex-col" style={{ flex:1 }}>
              <Row><Fd label="APR" value={form.apr} onChange={set("apr")} /></Row>
              <Row><Fd label="SALE PRICE" value={form.salePrice} onChange={set("salePrice")} /></Row>
              <Row><Fd label="TRADE ALLOWANCE" value={form.tradeAllowance} onChange={set("tradeAllowance")} /></Row>
              <Row><Fd label="*TIP" value={form.tip} onChange={set("tip")} /></Row>
              <Row><Fd label="DOWN PMT" value={form.downPmt} onChange={set("downPmt")} /></Row>
              <Row><Fd label="PICK UP PMTS" value={form.pickUpPmts} onChange={set("pickUpPmts")} /></Row>
              <Row><Fd label="DATE OF PICK UP PMTS" value={form.datePickUpPmts} onChange={set("datePickUpPmts")} /></Row>
              <Row><Fd label="AMT OF REG PMT" value={form.amtRegPmt} onChange={set("amtRegPmt")} /></Row>
              <Row><div className="flex items-center gap-3">{(["wk","biwk","month","sem"] as const).map(f => <Radio key={f} group="sl-freq" val={f} current={form.pmtFreq} label={f==="biwk"?"BI-WK":f.toUpperCase()} onChange={set("pmtFreq")} />)}</div></Row>
              <Row><Fd label="DATE OF 1ST PMT" value={form.date1stPmt} onChange={set("date1stPmt")} /></Row>
              <Row><div className="flex items-center gap-4"><div className="flex items-center gap-1"><span className="text-[8px] font-bold uppercase text-black">NEW TAG</span><Radio group="sl-tag" val="newTag" current={form.tagType} label="" onChange={set("tagType")} /></div><div className="flex items-center gap-1"><span className="text-[8px] font-bold uppercase text-black">TRANSFER</span><Radio group="sl-tag" val="transfer" current={form.tagType} label="" onChange={set("tagType")} /></div></div></Row>
              <Row><Fd label="COUNTY" value={form.county} onChange={set("county")} /></Row>
              <Row><div className="flex items-baseline gap-1 w-full"><span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">REGISTRATION</span><div className="border-b border-black flex-1 min-w-0"><input value={form.registration} onChange={e => set("registration")(e.target.value)} className="w-full bg-transparent text-[9px] font-medium text-black outline-none leading-none" /></div><span className="text-[8px] font-bold text-black">T</span></div></Row>
              <Row><span className="text-[8px] font-bold uppercase text-black">NOTES</span></Row>
              <Row><div className="border-b border-black/50 w-full"><input value={form.notes} onChange={e => set("notes")(e.target.value)} className="w-full bg-transparent text-[9px] text-black outline-none" /></div></Row>
              <Row><div className="border-b border-black/40 w-full"><input value={form.notes2} onChange={e => set("notes2")(e.target.value)} className="w-full bg-transparent text-[9px] text-black outline-none" /></div></Row>
              <Row><Fd label="SALESMAN" value={form.salesman} onChange={set("salesman")} /></Row>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slide 4: Buyers Order ────────────────────────────────────────────────────

const BBO = () => ({ date:"",customerName:"",street:"",city:"",st:"",zip:"",unitYear:"",unitMake:"",unitModel:"",unitVin:"",mileage:"",color:"",sellingPrice:"",tradeAllowance:"",netDifference:"",licenseTitle:"",stateTax:"",localTax:"",payoffTrade:"",subtotal:"",lessCash:"",balanceDue:"",tradeYearMake:"",tradeModel:"",tradeVin:"",tradeMileage:"",approvedBy:"",buyerSignature:"",lienInFavorOf:"" });

function BOSlide({ isActive, margin, onMarginChange }: { isActive: boolean; margin: number; onMarginChange: (m: number) => void }) {
  const [form, setForm] = useState(BBO());
  const [vinInput, setVinInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const set = (f: keyof ReturnType<typeof BBO>) => (v: string) => setForm(p => ({ ...p, [f]: v }));
  const pageH = `calc(11in - ${(margin * 2).toFixed(2)}in)`;

  const lookupVehicle = async () => {
    const q = vinInput.trim(); if (!q) return;
    setLooking(true);
    try {
      const res = await fetch(`/api/inspection?vin=${encodeURIComponent(q)}`);
      const data = await res.json();
      const v = Array.isArray(data) && data[0];
      if (v) setForm(prev => ({ ...prev, unitYear:v.year||prev.unitYear, unitMake:v.make||prev.unitMake, unitModel:v.model||prev.unitModel, unitVin:v.vin||prev.unitVin, mileage:v.miles||prev.mileage, color:v.color||prev.color }));
      else alert("No vehicle found.");
    } catch { alert("Lookup failed."); }
    finally { setLooking(false); }
  };
  const capture = async (scale = 2) => {
    if (!ref.current) return null;
    return await html2canvas(ref.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
  };
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
    <div className={`slide${isActive ? " active" : ""}`}
      style={{ minWidth:"100vw", height:"100%", overflowY:"auto", scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
      <SlideControls margin={margin} onMarginChange={onMarginChange}
        onClear={() => { if (confirm("Clear all fields?")) setForm(BBO()); }}
        onPrint={() => window.print()} onDownload={handleDownload} onShare={handleShare} busy={busy}
        vinInput={vinInput} onVinChange={setVinInput} onVinLookup={lookupVehicle} looking={looking} />
      <div className="form-wrapper py-4 px-4 flex justify-center bg-slate-950 flex-1">
        <div ref={ref} className="paper-form bg-white text-black shadow-lg"
          style={{ width:"7.5in", minHeight: pageH, display:"flex", flexDirection:"column", fontFamily:"Arial, sans-serif", border:"1px solid #ccc" }}>

          {/* Header */}
          <div className="text-center py-2 border-b border-black flex-none">
            <p className="text-[15px] font-black uppercase tracking-wide leading-tight">RIGHT PRICE AUTO SALES, INC.</p>
            <p className="text-[10px] font-bold uppercase leading-tight">5223 NW BROAD STREET</p>
            <p className="text-[10px] font-bold uppercase leading-tight">MURFREESBORO, TN. 37129</p>
            <p className="text-[10px] font-bold uppercase leading-tight">615-893-1727</p>
          </div>

          {/* BUYERS ORDER centered, Date right-balanced */}
          <div className="flex items-center px-3 py-[5px] border-b border-black flex-none">
            <div style={{ width:"110px" }} />
            <span className="flex-1 text-center text-[13px] font-bold uppercase tracking-widest">BUYERS ORDER</span>
            <Fd label="Date" value={form.date} onChange={set("date")} w="110px" />
          </div>

          {/* Customer Info */}
          <div className="px-3 pt-1.5 pb-1 border-b border-black flex-none flex flex-col gap-[5px]">
            <Fd label="Customer's Name" value={form.customerName} onChange={set("customerName")} />
            <div className="flex gap-4">
              <Fd label="Street" value={form.street} onChange={set("street")} />
              <Fd label="City" value={form.city} onChange={set("city")} />
              <Fd label="St" value={form.st} onChange={set("st")} w="38px" />
              <Fd label="Zip" value={form.zip} onChange={set("zip")} w="58px" />
            </div>
          </div>

          {/* Unit Sold */}
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

          {/* Body — fills remaining height */}
          <div className="grid grid-cols-2" style={{ flex:1 }}>

            {/* LEFT — items stacked; lw fixes label widths so all underlines align */}
            <div className="border-r border-black px-3 py-2 flex flex-col">
              <BR><Fd label="Selling Price" lw="96px" value={form.sellingPrice} onChange={set("sellingPrice")} /></BR>
              <BR><Fd label="Trade Allowance" lw="96px" value={form.tradeAllowance} onChange={set("tradeAllowance")} /></BR>
              <BR><Fd label="Net Difference" lw="96px" value={form.netDifference} onChange={set("netDifference")} /></BR>
              <BR><Fd label="License and Title" lw="96px" value={form.licenseTitle} onChange={set("licenseTitle")} /></BR>
              <BR><Fd label="State Tax" lw="96px" value={form.stateTax} onChange={set("stateTax")} /></BR>
              <BR><Fd label="Local Tax" lw="96px" value={form.localTax} onChange={set("localTax")} /></BR>
              <BR><Fd label="Payoff on trade" lw="96px" value={form.payoffTrade} onChange={set("payoffTrade")} /></BR>
              <BR><Fd label="Subtotal" lw="96px" value={form.subtotal} onChange={set("subtotal")} /></BR>
              <BR><Fd label="Less cash received" lw="96px" value={form.lessCash} onChange={set("lessCash")} /></BR>
              <BR><Fd label="Balance Due" lw="96px" value={form.balanceDue} onChange={set("balanceDue")} /></BR>
            </div>

            {/* RIGHT — trade-in top, window notice fills middle, approved by bottom */}
            <div className="px-3 py-2 flex flex-col">
              <div>
                <BR><span className="text-[10px] font-bold uppercase text-black">TRADE IN</span></BR>
                <BR><Fd label="Year and Make" value={form.tradeYearMake} onChange={set("tradeYearMake")} /></BR>
                <BR><Fd label="Model" value={form.tradeModel} onChange={set("tradeModel")} /></BR>
                <BR><Fd label="VIN #" value={form.tradeVin} onChange={set("tradeVin")} /></BR>
                <BR><Fd label="Mileage" value={form.tradeMileage} onChange={set("tradeMileage")} /></BR>
              </div>
              <div style={{ flex:1 }} className="flex items-center justify-center py-3 px-2">
                <p className="text-[9px] font-bold text-black leading-relaxed uppercase text-center">
                  THE INFORMATION YOU SEE ON THE WINDOW FORM FOR THE VEHICLE IS PART OF THIS CONTRACT.
                  INFORMATION IN THE WINDOW FORM OVERRIDES ANY CONTRARY PROVISIONS IN THE CONTRACT OF SALES.
                </p>
              </div>
              <BR><Fd label="Approved By" value={form.approvedBy} onChange={set("approvedBy")} /></BR>
            </div>
          </div>

          {/* Terms — full width */}
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

          {/* Buyer's Signature */}
          <div className="px-3 py-1.5 border-t border-black/30 flex-none">
            <Fd label="Buyer's Signature" value={form.buyerSignature} onChange={set("buyerSignature")} />
          </div>

          {/* Lien In Favor of */}
          <div className="px-3 py-1.5 border-t border-black/30 flex-none">
            <Fd label="Lien In Favor of" value={form.lienInFavorOf} onChange={set("lienInFavorOf")} />
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Main slider ──────────────────────────────────────────────────────────────

const FORMS = ["Express App — HS", "Express App — Generic", "Deal Sheet", "Buyers Order"];

export default function FormsSlider() {
  const [active, setActive] = useState(0);
  const [margins, setMargins] = useState([0.25, 0.25, 0.25, 0.25]);
  const trackRef = useRef<HTMLDivElement>(null);

  const setMargin = useCallback((idx: number, m: number) =>
    setMargins(prev => prev.map((v, i) => i === idx ? m : v)), []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      setActive(idx);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    setActive(i);
  };

  const activeMargin = margins[active];

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      <style>{`
        @media screen {
          .express-paper { zoom: 1.8; }
        }
        @media print {
          @page { size: letter; margin: ${activeMargin}in; }
          body { margin: 0 !important; background: #fff !important; }
          .slider-global-nav { display: none !important; }
          .slide-controls { display: none !important; }
          .slide-track { display: block !important; overflow: visible !important; height: auto !important; }
          .slide { display: none !important; }
          .slide.active { display: flex !important; flex-direction: column !important; overflow: visible !important; height: auto !important; min-width: 0 !important; }
          .form-wrapper { padding: 0 !important; overflow: visible !important; background: #fff !important; }
          .paper-form {
            width: 100% !important;
            height: calc(11in - ${(activeMargin * 2).toFixed(2)}in) !important;
            min-height: 0 !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            zoom: 1 !important;
          }
        }
        .lender-hint { transition: opacity 0.15s; }
        .hide-lender-hint .lender-hint { display: none !important; }
      `}</style>

      {/* Global nav */}
      <nav className="slider-global-nav bg-slate-900 border-b border-white/5 flex items-center justify-between px-4 py-2.5 shrink-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Suite</span>
        </Link>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-black tracking-tighter text-white uppercase italic">{FORMS[active]}</span>
          <div className="flex items-center gap-2">
            {FORMS.map((name, i) => (
              <button key={i} onClick={() => goTo(i)} title={name}
                className={`rounded-full transition-all duration-300 ${i === active ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/25 hover:bg-white/60"}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-20 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[9px] text-white/40 tabular-nums w-8 text-center">{active + 1} / {FORMS.length}</span>
          <button onClick={() => goTo(Math.min(FORMS.length - 1, active + 1))} disabled={active === FORMS.length - 1}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-20 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Scroll track — horizontal snap */}
      <div ref={trackRef} className="slide-track flex flex-1 overflow-x-auto overflow-y-hidden"
        style={{ scrollSnapType: "x mandatory", scrollBehavior: "smooth" }}>
        <HSSlide isActive={active === 0} margin={margins[0]} onMarginChange={m => setMargin(0, m)} />
        <GASlide isActive={active === 1} margin={margins[1]} onMarginChange={m => setMargin(1, m)} />
        <DSSlide isActive={active === 2} margin={margins[2]} onMarginChange={m => setMargin(2, m)} />
        <BOSlide isActive={active === 3} margin={margins[3]} onMarginChange={m => setMargin(3, m)} />
      </div>
    </div>
  );
}
