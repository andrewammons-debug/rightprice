"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Printer, Download, Share2,
  Loader2, RotateCcw, Search, Pencil,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Screen Editor UI Primitives ──────────────────────────────────────────────

const Sh = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-black uppercase tracking-wider text-primary mb-2 mt-4 leading-none">
    {children}
  </h3>
);

const F2 = ({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col min-w-0 flex-1">
    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{label}</span>
    <input value={value} onChange={e => onChange(e.target.value)}
      className="border border-slate-700 bg-slate-800 rounded px-3 py-2 text-sm font-medium text-white outline-none focus:border-primary transition-colors w-full" />
  </div>
);

const FR = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row gap-4">{children}</div>
);

const Fd2 = ({ label, value, onChange, w }: {
  label?: string; value: string; onChange: (v: string) => void; w?: string;
}) => (
  <div className={`flex flex-col min-w-0 ${w ? "" : "flex-1"}`} style={w ? { width: w } : {}}>
    {label && <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{label}</span>}
    <input value={value} onChange={e => onChange(e.target.value)}
      className="border border-slate-700 bg-slate-800 rounded px-3 py-2 text-sm font-medium text-white outline-none focus:border-primary transition-colors w-full" />
  </div>
);

const Radio2 = ({ group, val, current, label, onChange }: {
  group: string; val: string; current: string; label: string; onChange: (v: string) => void;
}) => (
  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 border border-slate-700 rounded px-3 py-2 flex-1 justify-center hover:border-slate-600 transition-colors">
    <input type="radio" name={group} checked={current === val} onChange={() => onChange(val)}
      className="w-3.5 h-3.5 accent-primary shrink-0" />
    <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">{label}</span>
  </label>
);

const ApplicantCol = ({ d, s, isCoApp }: {
  d: any; s: (f: string) => (v: string) => void; isCoApp: boolean;
}) => {
  const co = (f: string) => isCoApp ? "co" + f.charAt(0).toUpperCase() + f.slice(1) : f;
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <F2
          label={isCoApp ? "Co-Applicant Name / Co-Solicitante" : "Applicant Name / Solicitante"}
          value={d[co("name")]} onChange={s(co("name"))} />
        <FR>
          <F2 label="SSN / ITIN" value={d[co("ssn")]} onChange={s(co("ssn"))} />
          <F2 label="Date of Birth / Fecha de Nac." value={d[co("dob")]} onChange={s(co("dob"))} />
        </FR>
        <FR>
          <F2 label="Phone / Teléfono" value={d[co("phone")]} onChange={s(co("phone"))} />
          <F2 label="Work # / Trabajo" value={d[co("work")]} onChange={s(co("work"))} />
        </FR>
        <F2 label="Email / Correo Electrónico" value={d[co("email")]} onChange={s(co("email"))} />
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-800">
        <Sh>Residential / Residencia</Sh>
        <F2 label="Street Address / Dirección" value={d[co("addr")]} onChange={s(co("addr"))} />
        <FR>
          <F2 label="City / Ciudad" value={d[co("city")]} onChange={s(co("city"))} />
          <F2 label="St / Estado" value={d[co("st")]} onChange={s(co("st"))} />
          <F2 label="Zip / C.P." value={d[co("zip")]} onChange={s(co("zip"))} />
        </FR>
        <FR>
          <F2 label="Yrs/Mos at Residence / Años/Meses" value={d[co("yrs")]} onChange={s(co("yrs"))} />
          <F2 label="Rent or Mortg? / ¿Hipoteca?" value={d[co("rentMortg")]} onChange={s(co("rentMortg"))} />
          <F2 label="Amount / Monto" value={d[co("rentAmt")]} onChange={s(co("rentAmt"))} />
        </FR>
        <F2 label="Prev. Address (< 2 yrs) / Dir. Anterior" value={d[co("prevAddr")]} onChange={s(co("prevAddr"))} />
        <FR>
          <F2 label="City / Ciudad" value={d[co("prevCity")]} onChange={s(co("prevCity"))} />
          <F2 label="St / Estado" value={d[co("prevSt")]} onChange={s(co("prevSt"))} />
          <F2 label="Zip / C.P." value={d[co("prevZip")]} onChange={s(co("prevZip"))} />
        </FR>
        <FR>
          <F2 label="Yrs/Mos at Prev Res. / Años/Meses" value={d[co("prevYrs")]} onChange={s(co("prevYrs"))} />
          <F2 label="Rent or Own? / ¿Dueño?" value={d[co("prevRent")]} onChange={s(co("prevRent"))} />
          <F2 label="Amount / Monto" value={d[co("prevAmt")]} onChange={s(co("prevAmt"))} />
        </FR>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-800">
        <Sh>Employment / Empleo</Sh>
        <F2 label="Employer / Empleador" value={d[co("emp")]} onChange={s(co("emp"))} />
        <FR>
          <F2 label="Street / Calle" value={d[co("empStr")]} onChange={s(co("empStr"))} />
          <F2 label="City / Ciudad" value={d[co("empCity")]} onChange={s(co("empCity"))} />
          <F2 label="St / Estado" value={d[co("empSt")]} onChange={s(co("empSt"))} />
          <F2 label="Zip / C.P." value={d[co("empZip")]} onChange={s(co("empZip"))} />
        </FR>
        <FR>
          <F2 label="Position / Puesto" value={d[co("pos")]} onChange={s(co("pos"))} />
          <F2 label="Gross Income / Ingreso Bruto" value={d[co("gross")]} onChange={s(co("gross"))} />
        </FR>
        <F2 label="Yrs/Mos of Employment / Años/Meses" value={d[co("yrsEmp")]} onChange={s(co("yrsEmp"))} />
        <F2 label="Prev. Employer (< 2 yrs) / Empleador Anterior" value={d[co("prevEmp")]} onChange={s(co("prevEmp"))} />
        <F2 label="Yrs/Mos at Prev Employer / Años/Meses" value={d[co("prevYrsEmp")]} onChange={s(co("prevYrsEmp"))} />
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-800">
        <Sh>Monthly Obligations / Obligaciones Mensuales</Sh>
        <FR>
          <F2 label="Car Payment(s) / Pago(s) de Auto" value={d[co("carPmt")]} onChange={s(co("carPmt"))} />
          <F2 label="To Whom? / ¿A Quién?" value={d[co("carTo")]} onChange={s(co("carTo"))} />
        </FR>
      </div>
    </div>
  );
};

// ─── High-Fidelity Print-Only UI Primitives ──────────────────────────────────

const F = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col min-w-0 justify-center h-full">
    <span className="text-[5.5px] font-bold uppercase text-black leading-none">{label}</span>
    <input readOnly value={value}
      className="border-none bg-transparent text-[9px] font-semibold text-black outline-none w-full min-w-0 mt-[1px] p-0" />
  </div>
);

const Cell = ({ children, right = false, noBorderB = false }: {
  children: React.ReactNode; right?: boolean; noBorderB?: boolean;
}) => (
  <div className={["p-[3px] min-w-0 flex flex-col justify-center",
    right ? "" : "border-r border-black",
    noBorderB ? "" : "border-b border-black"].join(" ")}>
    {children}
  </div>
);

const Fd = ({ label, value, w, lw }: {
  label?: string; value: string; w?: string; lw?: string;
}) => (
  <div className={`flex items-baseline gap-[3px] min-w-0 ${w ? "" : "flex-1"}`} style={w ? { width: w } : {}}>
    {label && <span className="text-[8px] text-black font-bold whitespace-nowrap shrink-0" style={lw ? { minWidth: lw } : {}}>{label}</span>}
    <div className="border-b border-black flex-1 min-w-0">
      <input readOnly value={value}
        className="w-full bg-transparent text-[9px] font-semibold text-black outline-none leading-none border-none p-0" />
    </div>
  </div>
);

const Row = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex items-center" style={{ flex: 1, minHeight: 0 }}>{children}</div>
);

const BR = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex items-center py-[2px]">{children}</div>
);

const Radio = ({ group, val, current, label }: {
  group: string; val: string; current: string; label: string;
}) => (
  <div className="flex items-center gap-[3px]">
    <input readOnly type="radio" name={group} checked={current === val}
      className="w-2.5 h-2.5 accent-black shrink-0 pointer-events-none" />
    <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">{label}</span>
  </div>
);

const PrintApplicantCol = ({ d, isCoApp }: { d: any; isCoApp: boolean }) => {
  const co = (f: string) => isCoApp ? "co" + f.charAt(0).toUpperCase() + f.slice(1) : f;
  return (
    <div className="grid grid-cols-1 h-full" style={{ gridAutoRows: "1fr" }}>
      <Cell right={isCoApp}><F label={isCoApp ? "CO-APPLICANT'S NAME / NOMBRE DE CO-PRESTATARIO" : "APPLICANT'S NAME / NOMBRE DE PRESTATARIO"} value={d[co("name")]} /></Cell>
      <Cell right={isCoApp}><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="SSN/ITIN" value={d[co("ssn")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="DATE OF BIRTH / FECHA DE NACIMIENTO" value={d[co("dob")]} /></div></div></Cell>
      <Cell right={isCoApp}><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="PHONE / NÚMERO DE TELÉFONO" value={d[co("phone")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="WORK NUMBER / NÚMERO DE TRABAJO" value={d[co("work")]} /></div></div></Cell>
      <Cell right={isCoApp}><F label="EMAIL ADDRESS / CORREO ELECTRÓNICO" value={d[co("email")]} /></Cell>
      <Cell right={isCoApp}><F label="STREET ADDRESS / DIRECCIÓN" value={d[co("addr")]} /></Cell>
      <Cell right={isCoApp}><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d[co("city")]} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE / ESTADO" value={d[co("st")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP / CÓDIGO POSTAL" value={d[co("zip")]} /></div></div></Cell>
      <Cell right={isCoApp}><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE / AÑOS/MESES DE RESIDENCIA" value={d[co("yrs")]} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR MORTG? / ¿ALQUILER O PROPIO?" value={d[co("rentMortg")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT / $PAGO MENSUAL" value={d[co("rentAmt")]} /></div></div></Cell>
      <Cell right={isCoApp}><F label="PREVIOUS STREET ADDRESS (IF CURRENT ADDRESS IS LESS THAN 2 YEARS) / DIRECCIÓN ANTERIOR" value={d[co("prevAddr")]} /></Cell>
      <Cell right={isCoApp}><div className="grid grid-cols-[2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d[co("prevCity")]} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE / ESTADO" value={d[co("prevSt")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP / CÓDIGO POSTAL" value={d[co("prevZip")]} /></div></div></Cell>
      <Cell right={isCoApp}><div className="grid grid-cols-[2fr_2fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT PREV RESIDENCE / AÑOS/MESES DE RESIDENCIA" value={d[co("prevYrs")]} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR OWN? / ¿ALQUILER O PROPIO?" value={d[co("prevRent")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT / $PAGO MENSUAL" value={d[co("prevAmt")]} /></div></div></Cell>
      <Cell right={isCoApp}><F label="EMPLOYER (OR SOURCE OF INCOME) / EMPLEADOR (FUENTE DE INGRESO)" value={d[co("emp")]} /></Cell>
      <Cell right={isCoApp}><div className="grid grid-cols-[2fr_2fr_1fr_1fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="STREET ADDRESS / DIRECCIÓN" value={d[co("empStr")]} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d[co("empCity")]} /></div><div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE / ESTADO" value={d[co("empSt")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="ZIP / CÓDIGO POSTAL" value={d[co("empZip")]} /></div></div></Cell>
      <Cell right={isCoApp}><div className="grid grid-cols-2 h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="POSITION/TITLE / POSICIÓN/TÍTULO" value={d[co("pos")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="GROSS INCOME (FREQUENCY) / INGRESO BRUTO" value={d[co("gross")]} /></div></div></Cell>
      <Cell right={isCoApp}><F label="YRS/MOS OF EMPLOYMENT / AÑOS/MESES DE EMPLEO" value={d[co("yrsEmp")]} /></Cell>
      <Cell right={isCoApp}><F label="PREVIOUS EMPLOYER (IF CURRENT EMPLOYER < 2 YRS) / EMPLEADOR ANTERIOR" value={d[co("prevEmp")]} /></Cell>
      <Cell right={isCoApp}><F label="YRS/MOS OF EMPLOYMENT / AÑOS/MESES DE EMPLEO" value={d[co("prevYrsEmp")]} /></Cell>
      <Cell right={isCoApp} noBorderB><div className="grid grid-cols-[3fr_2fr] h-full"><div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="MONTHLY CAR PAYMENT(S) / PAGOS MENSUALES DE AUTO" value={d[co("carPmt")]} /></div><div className="pl-1 flex flex-col justify-center"><F label="TO WHOM / ¿A QUIEN?" value={d[co("carTo")]} /></div></div></Cell>
    </div>
  );
};

// ─── Slide Controls ───────────────────────────────────────────────────────────

function SlideControls({ margin, onMarginChange, onClear, onPrint, onDownload, onShare, busy,
  vinInput, onVinChange, onVinLookup, looking }: {
  margin: number; onMarginChange: (m: number) => void;
  onClear: () => void; onPrint: () => void; onDownload: () => void; onShare: () => void;
  busy: boolean; vinInput?: string; onVinChange?: (v: string) => void;
  onVinLookup?: () => void; looking?: boolean;
}) {
  return (
    <div className="slide-controls bg-slate-850 border-b border-slate-800/80 px-4 py-3 flex flex-wrap items-center gap-3 shrink-0 z-40 shadow-md">
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 rounded border border-slate-700/60 shadow-inner">
        <button onClick={() => onMarginChange(Math.max(0.25, parseFloat((margin - 0.25).toFixed(2))))}
          className="text-white/60 hover:text-white w-5 text-center font-bold text-sm">−</button>
        <span className="text-[11px] font-bold text-white w-8 text-center tabular-nums">{margin}"</span>
        <button onClick={() => onMarginChange(Math.min(1.0, parseFloat((margin + 0.25).toFixed(2))))}
          className="text-white/60 hover:text-white w-5 text-center font-bold text-sm">+</button>
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider ml-1">margin</span>
      </div>
      {vinInput !== undefined && (
        <div className="flex gap-1.5 items-center">
          <input value={vinInput} onChange={e => onVinChange?.(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onVinLookup?.(); }}
            placeholder="VIN lookup…"
            className="w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-primary" />
          <button onClick={onVinLookup} disabled={looking}
            className="flex items-center justify-center p-2 bg-primary hover:bg-primary/80 text-white rounded-lg disabled:opacity-50 transition-colors cursor-pointer">
            {looking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <button onClick={onClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-red-900/40 hover:border-red-900/60 text-slate-300 hover:text-red-200 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> Clear
        </button>
        <button onClick={onPrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer">
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
        <button onClick={onDownload} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/60 border border-blue-800/80 hover:bg-blue-800 text-blue-100 text-xs font-bold uppercase rounded-lg disabled:opacity-50 transition-all cursor-pointer">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
        </button>
        <button onClick={onShare} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/60 border border-emerald-800/80 hover:bg-emerald-800 text-emerald-100 text-xs font-bold uppercase rounded-lg disabled:opacity-50 transition-all cursor-pointer">
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>
    </div>
  );
}

// ─── Slide 1: Heritage South Express App ─────────────────────────────────────

const BHS = () => ({ amt:"",name:"",ssn:"",dob:"",phone:"",work:"",email:"",addr:"",city:"",st:"",zip:"",yrs:"",rentMortg:"",rentAmt:"",prevAddr:"",prevCity:"",prevSt:"",prevZip:"",prevYrs:"",prevRent:"",prevAmt:"",emp:"",empStr:"",empCity:"",empSt:"",empZip:"",pos:"",gross:"",yrsEmp:"",prevEmp:"",prevYrsEmp:"",carPmt:"",carTo:"",sig:"",sigDate:"",coName:"",coSsn:"",coDob:"",coPhone:"",coWork:"",coEmail:"",coAddr:"",coCity:"",coSt:"",coZip:"",coYrs:"",coRentMortg:"",coRentAmt:"",coPrevAddr:"",coPrevCity:"",coPrevSt:"",coPrevZip:"",coPrevYrs:"",coPrevRent:"",coPrevAmt:"",coEmp:"",coEmpStr:"",coEmpCity:"",coEmpSt:"",coEmpZip:"",coPos:"",coGross:"",coYrsEmp:"",coPrevEmp:"",coPrevYrsEmp:"",coCarPmt:"",coCarTo:"",coSig:"",coSigDate:"" });

function HSSlide({ isActive, margin, onMarginChange }: { isActive: boolean; margin: number; onMarginChange: (m: number) => void }) {
  const [d, setD] = useState(BHS());
  const [busy, setBusy] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const s = (f: string) => (v: string) => setD(p => ({ ...p, [f]: v }));
  const pageH = `calc(11in - ${(margin * 2).toFixed(2)}in)`;

  const capture = async (scale = 2) => {
    if (!printRef.current) return null;
    return await html2canvas(printRef.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
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
      
      <div className="form-wrapper py-8 px-6 flex justify-center items-start bg-slate-950 flex-1 overflow-y-auto">
        
        {/* On-Screen Editor UI */}
        <div className="screen-editor w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 text-white overflow-visible">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-white">Express Application</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1 leading-none">Aplicación Rápida</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <span className="text-xs font-semibold text-slate-400">Amount Requested / Cantidad Solicitada:</span>
              <input value={d.amt} onChange={e => s("amt")(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm font-semibold text-white outline-none w-32 focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Applicant / Solicitante</h2>
              <ApplicantCol d={d} s={s} isCoApp={false} />
            </div>
            <div className="space-y-6 md:border-l md:border-slate-850 md:pl-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Co-Applicant / Co-Solicitante</h2>
              <ApplicantCol d={d} s={s} isCoApp={true} />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-400">Applicant Signature / Firma</span>
              <FR>
                <input placeholder="Applicant Signature" value={d.sig} onChange={e => s("sig")(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full outline-none focus:border-primary" />
                <input placeholder="Date" value={d.sigDate} onChange={e => s("sigDate")(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-28 outline-none focus:border-primary" />
              </FR>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-400">Co-Applicant Signature / Firma</span>
              <FR>
                <input placeholder="Co-Applicant Signature" value={d.coSig} onChange={e => s("coSig")(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full outline-none focus:border-primary" />
                <input placeholder="Date" value={d.coSigDate} onChange={e => s("coSigDate")(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-28 outline-none focus:border-primary" />
              </FR>
            </div>
          </div>
        </div>

        {/* High-Fidelity Print-Only Template (Positioned off-screen) */}
        <div ref={printRef} className="print-form-container express-paper bg-white text-black border-2 border-black shadow-none"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "0",
            width: "7.5in",
            minHeight: pageH,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Arial, sans-serif"
          }}
        >
          <div className="flex items-stretch border-b-2 border-black flex-none">
            <div className="flex-1 p-2 border-r-2 border-black">
              <div className="text-[16px] font-black uppercase tracking-wide leading-none text-black">EXPRESS APPLICATION</div>
              <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5 leading-none text-black">APLICACIÓN RÁPIDA</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-[7px] font-bold uppercase whitespace-nowrap text-black">AMOUNT REQUESTED / CANTIDAD SOLICITADA:</span>
                <input readOnly value={d.amt} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none flex-1 min-w-0 p-0" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-2 min-w-[130px] text-black">
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
            <div className="p-[3px] border-r border-black text-[7px] font-black uppercase tracking-widest text-black">APPLICANT</div>
            <div className="p-[3px] text-[7px] font-black uppercase tracking-widest text-black">CO-APPLICANT</div>
          </div>
          <div className="grid grid-cols-2" style={{ flex:1 }}>
            <div className="border-r border-black h-full">
              <PrintApplicantCol d={d} isCoApp={false} />
            </div>
            <div className="h-full">
              <PrintApplicantCol d={d} isCoApp={true} />
            </div>
          </div>
          <div className="grid grid-cols-2 border-t-2 border-black flex-none">
            <div className="border-r border-black p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div>
                <div className="text-[6px] font-black uppercase leading-none text-black">APPLICANT'S SIGNATURE / FIRMA</div>
                <input readOnly value={d.sig} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-full mt-0.5 p-0" />
              </div>
              <div>
                <div className="text-[6px] font-black uppercase leading-none text-black">DATE</div>
                <input readOnly value={d.sigDate} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-full mt-0.5 p-0" />
              </div>
            </div>
            <div className="p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div>
                <div className="text-[6px] font-black uppercase leading-none text-black">CO-APPLICANT'S SIGNATURE / FIRMA</div>
                <input readOnly value={d.coSig} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-full mt-0.5 p-0" />
              </div>
              <div>
                <div className="text-[6px] font-black uppercase leading-none text-black">DATE</div>
                <input readOnly value={d.coSigDate} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-full mt-0.5 p-0" />
              </div>
            </div>
          </div>
          <div className="border-t border-black p-2 text-[6.5px] leading-snug text-black flex-none">
            <p className="font-semibold">I hereby authorize Heritage South Community Credit Union to request my credit report from a credit reporting agency.</p>
            <p className="mt-0.5">Autorizo a Heritage South Community Credit Union que solicite mi reporte de crédito de una agencia de crédito.</p>
            <div className="grid grid-cols-2 gap-x-6 mt-1 text-[6px] text-black/80">
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
  const printRef = useRef<HTMLDivElement>(null);
  const s = (f: string) => (v: string) => setD(p => ({ ...p, [f]: v }));
  const displayLender = lender.trim() || "LENDER NAME";
  const pageH = `calc(11in - ${(margin * 2).toFixed(2)}in)`;

  const capture = async (scale = 2) => {
    if (!printRef.current) return null;
    return await html2canvas(printRef.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
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
      
      <div className="form-wrapper py-8 px-6 flex justify-center items-start bg-slate-950 flex-1 overflow-y-auto">
        
        {/* On-Screen Editor UI */}
        <div className="screen-editor w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 text-white overflow-visible">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-white">Express Application</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1 leading-none">Aplicación Rápida</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700/30">
                <span className="text-xs font-semibold text-slate-450">Lender:</span>
                {editingLender ? (
                  <input autoFocus value={lender} onChange={e => setLender(e.target.value)}
                    onBlur={() => setEditingLender(false)}
                    onKeyDown={e => { if (e.key === "Enter") setEditingLender(false); }}
                    className="bg-slate-700 border border-slate-650 rounded px-2 py-1 text-xs font-semibold text-white outline-none w-36" />
                ) : (
                  <div onClick={() => setEditingLender(true)} className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-primary hover:underline">
                    <span>{displayLender}</span>
                    <Pencil className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700/30">
                <span className="text-xs font-semibold text-slate-400">Amount Requested:</span>
                <input value={d.amt} onChange={e => s("amt")(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm font-semibold text-white outline-none w-28 focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Applicant / Solicitante</h2>
              <ApplicantCol d={d} s={s} isCoApp={false} />
            </div>
            <div className="space-y-6 md:border-l md:border-slate-850 md:pl-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Co-Applicant / Co-Solicitante</h2>
              <ApplicantCol d={d} s={s} isCoApp={true} />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-400">Applicant Signature / Firma</span>
              <FR>
                <input placeholder="Applicant Signature" value={d.sig} onChange={e => s("sig")(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full outline-none focus:border-primary" />
                <input placeholder="Date" value={d.sigDate} onChange={e => s("sigDate")(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-28 outline-none focus:border-primary" />
              </FR>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-400">Co-Applicant Signature / Firma</span>
              <FR>
                <input placeholder="Co-Applicant Signature" value={d.coSig} onChange={e => s("coSig")(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full outline-none focus:border-primary" />
                <input placeholder="Date" value={d.coSigDate} onChange={e => s("coSigDate")(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-28 outline-none focus:border-primary" />
              </FR>
            </div>
          </div>
        </div>

        {/* High-Fidelity Print-Only Template (Positioned off-screen) */}
        <div ref={printRef} className="print-form-container express-paper bg-white text-black border-2 border-black shadow-none"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "0",
            width: "7.5in",
            minHeight: pageH,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Arial, sans-serif"
          }}
        >
          <div className="flex items-stretch border-b-2 border-black flex-none">
            <div className="flex-1 p-2 border-r-2 border-black">
              <div className="text-[16px] font-black uppercase tracking-wide leading-none text-black">EXPRESS APPLICATION</div>
              <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5 leading-none text-black">APLICACIÓN RÁPIDA</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-[7px] font-bold uppercase whitespace-nowrap text-black">AMOUNT REQUESTED / CANTIDAD SOLICITADA:</span>
                <input readOnly value={d.amt} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none flex-1 min-w-0 p-0 text-black" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-2 min-w-[130px] text-black">
              <div className="text-[14px] font-black leading-tight text-black" style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>
                {displayLender}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-black flex-none">
            <div className="p-[3px] border-r border-black text-[7px] font-black uppercase tracking-widest text-black">APPLICANT</div>
            <div className="p-[3px] text-[7px] font-black uppercase tracking-widest text-black">CO-APPLICANT</div>
          </div>
          <div className="grid grid-cols-2" style={{ flex:1 }}>
            <div className="border-r border-black h-full">
              <PrintApplicantCol d={d} isCoApp={false} />
            </div>
            <div className="h-full">
              <PrintApplicantCol d={d} isCoApp={true} />
            </div>
          </div>
          <div className="grid grid-cols-2 border-t-2 border-black flex-none">
            <div className="border-r border-black p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div>
                <div className="text-[6px] font-black uppercase leading-none text-black">APPLICANT'S SIGNATURE / FIRMA</div>
                <input readOnly value={d.sig} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-full mt-0.5 p-0 text-black" />
              </div>
              <div>
                <div className="text-[6px] font-black uppercase leading-none text-black">DATE</div>
                <input readOnly value={d.sigDate} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-full mt-0.5 p-0 text-black" />
              </div>
            </div>
            <div className="p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div>
                <div className="text-[6px] font-black uppercase leading-none text-black">CO-APPLICANT'S SIGNATURE / FIRMA</div>
                <input readOnly value={d.coSig} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-full mt-0.5 p-0 text-black" />
              </div>
              <div>
                <div className="text-[6px] font-black uppercase leading-none text-black">DATE</div>
                <input readOnly value={d.coSigDate} className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-full mt-0.5 p-0 text-black" />
              </div>
            </div>
          </div>
          <div className="border-t border-black p-2 text-[6.5px] leading-snug text-black flex-none">
            <p className="font-semibold text-black">I hereby authorize {displayLender} to request my credit report from a credit reporting agency.</p>
            <p className="mt-0.5 text-black">Autorizo a {displayLender} que solicite mi reporte de crédito de una agencia de crédito.</p>
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
  const printRef = useRef<HTMLDivElement>(null);
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
    if (!printRef.current) return null;
    return await html2canvas(printRef.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
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
      
      <div className="form-wrapper py-8 px-6 flex justify-center items-start bg-slate-950 flex-1 overflow-y-auto">
        
        {/* On-Screen Editor UI */}
        <div className="screen-editor w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 text-white overflow-visible">
          <div className="border-b border-slate-855 pb-4">
            <h1 className="text-xl font-black uppercase tracking-wider text-white">Sold Deal Sheet</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Sh>Sold Vehicle</Sh>
              <div className="space-y-3">
                <Fd2 label="Stock #" value={form.stockNo} onChange={set("stockNo")} />
                <FR>
                  <Fd2 label="Year" value={form.year} onChange={set("year")} />
                  <Fd2 label="Make" value={form.make} onChange={set("make")} />
                </FR>
                <FR>
                  <Fd2 label="Model" value={form.model} onChange={set("model")} />
                  <Fd2 label="Miles" value={form.miles} onChange={set("miles")} />
                </FR>
                <Fd2 label="Warranty" value={form.warranty} onChange={set("warranty")} />
                <Fd2 label="Email Address" value={form.email} onChange={set("email")} />
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <Sh>Payment Method</Sh>
                <div className="flex gap-4">
                  <Radio2 group="v2pay" val="cash" current={form.paymentType} label="Cash" onChange={set("paymentType")} />
                  <Radio2 group="v2pay" val="creditCard" current={form.paymentType} label="Credit Card" onChange={set("paymentType")} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-slate-400">Recurring Payment:</span>
                  <div className="flex gap-4 w-48">
                    <Radio2 group="v2recur" val="yes" current={form.recurringPmt} label="Yes" onChange={set("recurringPmt")} />
                    <Radio2 group="v2recur" val="no" current={form.recurringPmt} label="No" onChange={set("recurringPmt")} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <Sh>Trade-In</Sh>
                <div className="space-y-3">
                  <FR>
                    <Fd2 label="Year" value={form.tradeYear} onChange={set("tradeYear")} />
                    <Fd2 label="Make" value={form.tradeMake} onChange={set("tradeMake")} />
                  </FR>
                  <FR>
                    <Fd2 label="Model" value={form.tradeModel} onChange={set("tradeModel")} />
                    <Fd2 label="Miles" value={form.tradeMiles} onChange={set("tradeMiles")} />
                  </FR>
                  <FR>
                    <Fd2 label="Color" value={form.tradeColor} onChange={set("tradeColor")} />
                    <Fd2 label="ACV" value={form.tradeAcv} onChange={set("tradeAcv")} />
                  </FR>
                </div>
              </div>
            </div>

            <div className="space-y-6 md:border-l md:border-slate-850 md:pl-8">
              <Sh>Finance Details</Sh>
              <div className="space-y-3">
                <FR>
                  <Fd2 label="APR" value={form.apr} onChange={set("apr")} />
                  <Fd2 label="Sale Price" value={form.salePrice} onChange={set("salePrice")} />
                </FR>
                <FR>
                  <Fd2 label="Trade Allowance" value={form.tradeAllowance} onChange={set("tradeAllowance")} />
                  <Fd2 label="*TIP" value={form.tip} onChange={set("tip")} />
                </FR>
                <FR>
                  <Fd2 label="Down Payment" value={form.downPmt} onChange={set("downPmt")} />
                  <Fd2 label="Pick Up Payments" value={form.pickUpPmts} onChange={set("pickUpPmts")} />
                </FR>
                <Fd2 label="Date of Pick Up Payments" value={form.datePickUpPmts} onChange={set("datePickUpPmts")} />
                <FR>
                  <Fd2 label="Amt of Regular Payment" value={form.amtRegPmt} onChange={set("amtRegPmt")} />
                  <Fd2 label="Date of 1st Payment" value={form.date1stPmt} onChange={set("date1stPmt")} />
                </FR>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5 block">Payment Frequency</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["wk","biwk","month","sem"] as const).map(f => (
                      <Radio2 key={f} group="v2freq" val={f} current={form.pmtFreq}
                        label={f==="biwk"?"Bi-Wk":f==="month"?"Monthly":f==="sem"?"Semi":f.toUpperCase()} onChange={set("pmtFreq")} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <Sh>Tag & Registration</Sh>
                <div className="flex gap-4">
                  <Radio2 group="v2tag" val="newTag" current={form.tagType} label="New Tag" onChange={set("tagType")} />
                  <Radio2 group="v2tag" val="transfer" current={form.tagType} label="Transfer" onChange={set("tagType")} />
                </div>
                <FR>
                  <Fd2 label="County" value={form.county} onChange={set("county")} />
                  <Fd2 label="Registration" value={form.registration} onChange={set("registration")} />
                </FR>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <Sh>Notes & Salesperson</Sh>
                <Fd2 label="Notes Line 1" value={form.notes} onChange={set("notes")} />
                <Fd2 label="Notes Line 2" value={form.notes2} onChange={set("notes2")} />
                <Fd2 label="Salesman" value={form.salesman} onChange={set("salesman")} />
              </div>
            </div>
          </div>
        </div>

        {/* High-Fidelity Print-Only Template (Positioned off-screen) */}
        <div ref={printRef} className="print-form-container bg-white text-black border-2 border-black shadow-none"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "0",
            width: "7.5in",
            minHeight: pageH,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Arial, sans-serif"
          }}
        >
          <div className="border-b-2 border-black text-center py-1 flex-none">
            <span className="text-[17px] font-black uppercase tracking-[0.2em] underline text-black">SOLD DEAL SHEET</span>
          </div>
          <div className="grid grid-cols-2 border-b border-black flex-none">
            <div className="px-2 py-[2px] border-r-2 border-black text-[9px] font-black uppercase underline text-black">SOLD VEHICLE</div>
            <div className="px-2 py-[2px] flex items-center gap-8 text-black">
              <span className="text-[9px] font-black uppercase underline">FINANCE</span>
              <span className="text-[9px] font-black uppercase underline">CASH</span>
            </div>
          </div>
          <div className="grid grid-cols-2" style={{ flex:1 }}>
            <div className="border-r-2 border-black px-2 flex flex-col justify-between text-black" style={{ flex:1, paddingBottom: "4px" }}>
              <Row><Fd label="STOCK #" value={form.stockNo} /></Row>
              <Row><Fd label="YEAR" value={form.year} /></Row>
              <Row><Fd label="MAKE" value={form.make} /></Row>
              <Row><Fd label="MODEL" value={form.model} /></Row>
              <Row><Fd label="MILES" value={form.miles} /></Row>
              <Row><Fd label="WARRANTY" value={form.warranty} /></Row>
              <Row><Fd label="EMAIL ADDRESS" value={form.email} /></Row>
              <Row>
                <div className="flex items-center gap-4 text-black py-0.5">
                  <Radio group="psl-pay" val="cash" current={form.paymentType} label="CASH" />
                  <Radio group="psl-pay" val="creditCard" current={form.paymentType} label="CREDIT CARD" />
                </div>
              </Row>
              <Row>
                <div className="flex items-center gap-2 text-black py-0.5">
                  <span className="text-[8px] font-bold uppercase text-black">RECURRING PMT:</span>
                  <Radio group="psl-recur" val="yes" current={form.recurringPmt} label="YES" />
                  <Radio group="psl-recur" val="no" current={form.recurringPmt} label="NO" />
                </div>
              </Row>
              <div className="border-t border-black/40 my-1"></div>
              <Row><span className="text-[8px] font-black uppercase underline text-black">TRADE-IN</span></Row>
              <Row><Fd label="YEAR" value={form.tradeYear} /></Row>
              <Row><Fd label="MAKE" value={form.tradeMake} /></Row>
              <Row><Fd label="MODEL" value={form.tradeModel} /></Row>
              <Row><Fd label="MILES" value={form.tradeMiles} /></Row>
              <Row><Fd label="COLOR" value={form.tradeColor} /></Row>
              <Row><Fd label="ACV" value={form.tradeAcv} /></Row>
            </div>
            <div className="px-2 flex flex-col justify-between text-black" style={{ flex:1, paddingBottom: "4px" }}>
              <Row><Fd label="APR" value={form.apr} /></Row>
              <Row><Fd label="SALE PRICE" value={form.salePrice} /></Row>
              <Row><Fd label="TRADE ALLOWANCE" value={form.tradeAllowance} /></Row>
              <Row><Fd label="*TIP" value={form.tip} /></Row>
              <Row><Fd label="DOWN PMT" value={form.downPmt} /></Row>
              <Row><Fd label="PICK UP PMTS" value={form.pickUpPmts} /></Row>
              <Row><Fd label="DATE OF PICK UP PMTS" value={form.datePickUpPmts} /></Row>
              <Row><Fd label="AMT OF REG PMT" value={form.amtRegPmt} /></Row>
              <Row>
                <div className="flex items-center gap-3 text-black py-0.5">
                  {(["wk","biwk","month","sem"] as const).map(f => (
                    <Radio key={f} group="psl-freq" val={f} current={form.pmtFreq} label={f==="biwk"?"BI-WK":f.toUpperCase()} />
                  ))}
                </div>
              </Row>
              <Row><Fd label="DATE OF 1ST PMT" value={form.date1stPmt} /></Row>
              <Row>
                <div className="flex items-center gap-4 text-black py-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase text-black">NEW TAG</span>
                    <Radio group="psl-tag" val="newTag" current={form.tagType} label="" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase text-black">TRANSFER</span>
                    <Radio group="psl-tag" val="transfer" current={form.tagType} label="" />
                  </div>
                </div>
              </Row>
              <Row><Fd label="COUNTY" value={form.county} /></Row>
              <Row>
                <div className="flex items-baseline gap-1 w-full text-black">
                  <span className="text-[8px] font-bold uppercase text-black whitespace-nowrap">REGISTRATION</span>
                  <div className="border-b border-black flex-1 min-w-0">
                    <input readOnly value={form.registration} className="w-full bg-transparent text-[9px] font-semibold text-black outline-none border-none p-0" />
                  </div>
                  <span className="text-[8px] font-bold text-black">T</span>
                </div>
              </Row>
              <div className="border-t border-black/40 my-1"></div>
              <Row><span className="text-[8px] font-bold uppercase text-black">NOTES</span></Row>
              <Row><div className="border-b border-black/50 w-full"><input readOnly value={form.notes} className="w-full bg-transparent text-[9px] font-semibold text-black outline-none border-none p-0" /></div></Row>
              <Row><div className="border-b border-black/40 w-full"><input readOnly value={form.notes2} className="w-full bg-transparent text-[9px] font-semibold text-black outline-none border-none p-0" /></div></Row>
              <Row><Fd label="SALESMAN" value={form.salesman} /></Row>
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
  const printRef = useRef<HTMLDivElement>(null);
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
    if (!printRef.current) return null;
    return await html2canvas(printRef.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
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
      
      <div className="form-wrapper py-8 px-6 flex justify-center items-start bg-slate-950 flex-1 overflow-y-auto">
        
        {/* On-Screen Editor UI */}
        <div className="screen-editor w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 text-white overflow-visible">
          <div className="border-b border-slate-855 pb-4 text-center">
            <h1 className="text-lg font-black uppercase tracking-wider text-white">Right Price Auto Sales, Inc.</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase">Buyers Order Editor</p>
          </div>

          <div className="space-y-4">
            <Sh>Customer Details</Sh>
            <FR>
              <Fd2 label="Customer's Name" value={form.customerName} onChange={set("customerName")} />
              <Fd2 label="Date" value={form.date} onChange={set("date")} w="180px" />
            </FR>
            <FR>
              <Fd2 label="Street" value={form.street} onChange={set("street")} />
              <Fd2 label="City" value={form.city} onChange={set("city")} />
              <Fd2 label="St" value={form.st} onChange={set("st")} w="70px" />
              <Fd2 label="Zip" value={form.zip} onChange={set("zip")} w="110px" />
            </FR>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <Sh>Unit Sold</Sh>
            <FR>
              <Fd2 label="Year" value={form.unitYear} onChange={set("unitYear")} w="100px" />
              <Fd2 label="Make" value={form.unitMake} onChange={set("unitMake")} />
              <Fd2 label="Model" value={form.unitModel} onChange={set("unitModel")} />
              <Fd2 label="Vin #" value={form.unitVin} onChange={set("unitVin")} />
            </FR>
            <FR>
              <Fd2 label="Mileage" value={form.mileage} onChange={set("mileage")} />
              <Fd2 label="Color" value={form.color} onChange={set("color")} />
            </FR>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800">
            <div className="space-y-3">
              <Sh>Financial items</Sh>
              <Fd2 label="Selling Price" value={form.sellingPrice} onChange={set("sellingPrice")} />
              <Fd2 label="Trade Allowance" value={form.tradeAllowance} onChange={set("tradeAllowance")} />
              <Fd2 label="Net Difference" value={form.netDifference} onChange={set("netDifference")} />
              <Fd2 label="License and Title" value={form.licenseTitle} onChange={set("licenseTitle")} />
              <Fd2 label="State Tax" value={form.stateTax} onChange={set("stateTax")} />
              <Fd2 label="Local Tax" value={form.localTax} onChange={set("localTax")} />
              <Fd2 label="Payoff on trade" value={form.payoffTrade} onChange={set("payoffTrade")} />
              <Fd2 label="Subtotal" value={form.subtotal} onChange={set("subtotal")} />
              <Fd2 label="Less cash received" value={form.lessCash} onChange={set("lessCash")} />
              <Fd2 label="Balance Due" value={form.balanceDue} onChange={set("balanceDue")} />
            </div>

            <div className="space-y-4 md:border-l md:border-slate-850 md:pl-8">
              <Sh>Trade-In</Sh>
              <div className="space-y-3">
                <Fd2 label="Year and Make" value={form.tradeYearMake} onChange={set("tradeYearMake")} />
                <Fd2 label="Model" value={form.tradeModel} onChange={set("tradeModel")} />
                <Fd2 label="VIN #" value={form.tradeVin} onChange={set("tradeVin")} />
                <Fd2 label="Mileage" value={form.tradeMileage} onChange={set("tradeMileage")} />
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <Sh>Signatures & Lien</Sh>
                <Fd2 label="Approved By" value={form.approvedBy} onChange={set("approvedBy")} />
                <Fd2 label="Buyer's Signature" value={form.buyerSignature} onChange={set("buyerSignature")} />
                <Fd2 label="Lien In Favor Of" value={form.lienInFavorOf} onChange={set("lienInFavorOf")} />
              </div>
            </div>
          </div>
        </div>

        {/* High-Fidelity Print-Only Template (Positioned off-screen) */}
        <div ref={printRef} className="print-form-container bg-white text-black shadow-none"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "0",
            width: "7.5in",
            minHeight: pageH,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Arial, sans-serif",
            border: "1px solid #ccc"
          }}
        >
          {/* Header */}
          <div className="text-center py-2 border-b border-black flex-none text-black">
            <p className="text-[15px] font-black uppercase tracking-wide leading-tight">RIGHT PRICE AUTO SALES, INC.</p>
            <p className="text-[10px] font-bold uppercase leading-tight mt-0.5">5223 NW BROAD STREET · MURFREESBORO, TN. 37129 · 615-893-1727</p>
          </div>

          {/* BUYERS ORDER centered, Date right-balanced */}
          <div className="flex items-center px-3 py-[5px] border-b border-black flex-none text-black">
            <div style={{ width:"110px" }} />
            <span className="flex-1 text-center text-[13px] font-bold uppercase tracking-widest text-black">BUYERS ORDER</span>
            <Fd label="Date" value={form.date} w="110px" />
          </div>

          {/* Customer Info */}
          <div className="px-3 pt-1.5 pb-1 border-b border-black flex-none flex flex-col gap-[5px] text-black">
            <Fd label="Customer's Name" value={form.customerName} />
            <div className="flex gap-4">
              <Fd label="Street" value={form.street} />
              <Fd label="City" value={form.city} />
              <Fd label="St" value={form.st} w="38px" />
              <Fd label="Zip" value={form.zip} w="58px" />
            </div>
          </div>

          {/* Unit Sold */}
          <div className="px-3 pt-1 pb-1.5 border-b border-black flex-none flex flex-col gap-[5px] text-black">
            <div className="flex gap-4 items-baseline">
              <span className="text-[8.5px] font-bold text-black whitespace-nowrap">Unit Sold</span>
              <Fd label="Year" value={form.unitYear} w="58px" />
              <Fd label="Make" value={form.unitMake} />
              <Fd label="Model" value={form.unitModel} />
              <Fd label="Vin #" value={form.unitVin} />
            </div>
            <div className="flex gap-4">
              <Fd label="Mileage" value={form.mileage} w="160px" />
              <Fd label="Color" value={form.color} w="160px" />
            </div>
          </div>

          {/* Body — fills remaining height */}
          <div className="grid grid-cols-2 text-black" style={{ flex:1 }}>
            {/* LEFT — items stacked; lw fixes label widths so all underlines align */}
            <div className="border-r border-black px-3 py-2 flex flex-col justify-between">
              <BR><Fd label="Selling Price" lw="96px" value={form.sellingPrice} /></BR>
              <BR><Fd label="Trade Allowance" lw="96px" value={form.tradeAllowance} /></BR>
              <BR><Fd label="Net Difference" lw="96px" value={form.netDifference} /></BR>
              <BR><Fd label="License and Title" lw="96px" value={form.licenseTitle} /></BR>
              <BR><Fd label="State Tax" lw="96px" value={form.stateTax} /></BR>
              <BR><Fd label="Local Tax" lw="96px" value={form.localTax} /></BR>
              <BR><Fd label="Payoff on trade" lw="96px" value={form.payoffTrade} /></BR>
              <BR><Fd label="Subtotal" lw="96px" value={form.subtotal} /></BR>
              <BR><Fd label="Less cash received" lw="96px" value={form.lessCash} /></BR>
              <BR><Fd label="Balance Due" lw="96px" value={form.balanceDue} /></BR>
            </div>

            {/* RIGHT — trade-in top, window notice fills middle, approved by bottom */}
            <div className="px-3 py-2 flex flex-col justify-between">
              <div>
                <BR><span className="text-[10px] font-bold uppercase text-black">TRADE IN</span></BR>
                <BR><Fd label="Year and Make" value={form.tradeYearMake} /></BR>
                <BR><Fd label="Model" value={form.tradeModel} /></BR>
                <BR><Fd label="VIN #" value={form.tradeVin} /></BR>
                <BR><Fd label="Mileage" value={form.tradeMileage} /></BR>
              </div>
              <div style={{ flex:1 }} className="flex items-center justify-center py-2 px-1">
                <p className="text-[8px] font-bold text-black leading-normal uppercase text-center">
                  THE INFORMATION YOU SEE ON THE WINDOW FORM FOR THE VEHICLE IS PART OF THIS CONTRACT.
                  INFORMATION IN THE WINDOW FORM OVERRIDES ANY CONTRARY PROVISIONS IN THE CONTRACT OF SALES.
                </p>
              </div>
              <BR><Fd label="Approved By" value={form.approvedBy} /></BR>
            </div>
          </div>

          {/* Terms — full width */}
          <div className="px-3 py-1.5 border-t border-black flex-none text-black">
            <p className="text-[7.5px] font-bold uppercase mb-[1px]">TERMS OF AGREEMENT AND CERTIFICATION</p>
            <p className="text-[6.5px] text-black leading-snug">
              I agree to pay the balance on the terms specified and accept delivery of the vehicle within 48 hours after I have been notified
              that it is ready. In case I fail to take delivery of the vehicle when notified, my total credits may be retained as liquidated
              damages for your expense and efforts in the matter, and you may dispose of the vehicle(s) without any liability to me whatsoever.
              I certify that I am 18 years of age and hereby acknowledge receipt of copy of this order. I have read, understand and agree that
              this order includes all of the terms and conditions that this order cancels and supersedes any prior agreement and as of the date
              hereof composes the entire agreement relating to the subject matter covered hereby.
            </p>
          </div>

          {/* Buyer's Signature */}
          <div className="px-3 py-1 border-t border-black/30 flex-none text-black">
            <Fd label="Buyer's Signature" value={form.buyerSignature} />
          </div>

          {/* Lien In Favor of */}
          <div className="px-3 py-1 border-t border-black/30 flex-none text-black">
            <Fd label="Lien In Favor of" value={form.lienInFavorOf} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main Slider ──────────────────────────────────────────────────────────────

const FORMS = ["Express App — HS", "Express App — Generic", "Deal Sheet", "Buyers Order"];

export default function FormsSliderV2() {
  const [active, setActive] = useState(0);
  const [margins, setMargins] = useState([0.25, 0.25, 0.25, 0.25]);
  const trackRef = useRef<HTMLDivElement>(null);

  const setMargin = useCallback((idx: number, m: number) =>
    setMargins(prev => prev.map((v, i) => i === idx ? m : v)), []);

  const goTo = (i: number) => {
    const track = trackRef.current; if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    setActive(i);
  };

  const activeMargin = margins[active];

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      <style>{`
        @media print {
          @page { size: letter; margin: ${activeMargin}in !important; }
          body { margin: 0 !important; background: #fff !important; }
          .slider-global-nav { display: none !important; }
          .slide-controls { display: none !important; }
          .slide-track { display: block !important; overflow: visible !important; height: auto !important; }
          .slide { display: none !important; }
          .slide.active { display: flex !important; flex-direction: column !important; overflow: visible !important; height: auto !important; min-width: 0 !important; }
          .form-wrapper { padding: 0 !important; overflow: visible !important; background: #fff !important; }
          
          /* Hide Screen Editor Elements fully */
          .screen-editor { display: none !important; }
          
          /* Pull print-only container back to normal view context */
          .print-form-container {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
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
      `}</style>

      <nav className="slider-global-nav bg-slate-900 border-b border-white/5 flex items-center justify-between px-4 py-2.5 shrink-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Suite</span>
        </Link>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-tighter text-white uppercase italic">{FORMS[active]}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-primary border border-primary/40 px-1.5 py-0.5 rounded-sm">v2</span>
          </div>
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

      <div ref={trackRef} className="slide-track flex flex-1 overflow-x-auto overflow-y-hidden"
        style={{ scrollSnapType: "x mandatory", scrollBehavior: "smooth" }}
        onScroll={e => setActive(Math.round((e.target as HTMLDivElement).scrollLeft / (e.target as HTMLDivElement).clientWidth))}>
        <HSSlide isActive={active === 0} margin={margins[0]} onMarginChange={m => setMargin(0, m)} />
        <GASlide isActive={active === 1} margin={margins[1]} onMarginChange={m => setMargin(1, m)} />
        <DSSlide isActive={active === 2} margin={margins[2]} onMarginChange={m => setMargin(2, m)} />
        <BOSlide isActive={active === 3} margin={margins[3]} onMarginChange={m => setMargin(3, m)} />
      </div>
    </div>
  );
}
