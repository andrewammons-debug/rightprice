"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, Download, Share2, Loader2, RotateCcw, Pencil } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const F = ({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col min-w-0 justify-center h-full">
    <span className="text-[5.5px] font-bold uppercase text-black leading-none">{label}</span>
    <input value={value} onChange={e => onChange(e.target.value)}
      className="border-b border-black/60 bg-transparent text-[9px] font-medium text-black outline-none w-full min-w-0 mt-[1px]" />
  </div>
);

const Cell = ({ children, right = false, noBorderB = false }: {
  children: React.ReactNode; right?: boolean; noBorderB?: boolean;
}) => (
  <div className={[
    "p-[3px] min-w-0 flex flex-col justify-center",
    right ? "" : "border-r border-black",
    noBorderB ? "" : "border-b border-black/40",
  ].join(" ")}>
    {children}
  </div>
);

const BLANK = () => ({
  amt: "",
  name: "", ssn: "", dob: "", phone: "", work: "", email: "", addr: "",
  city: "", st: "", zip: "", yrs: "", rentMortg: "", rentAmt: "",
  prevAddr: "", prevCity: "", prevSt: "", prevZip: "", prevYrs: "", prevRent: "", prevAmt: "",
  emp: "", empStr: "", empCity: "", empSt: "", empZip: "", pos: "", gross: "", yrsEmp: "",
  prevEmp: "", prevYrsEmp: "", carPmt: "", carTo: "", sig: "", sigDate: "",
  coName: "", coSsn: "", coDob: "", coPhone: "", coWork: "", coEmail: "", coAddr: "",
  coCity: "", coSt: "", coZip: "", coYrs: "", coRentMortg: "", coRentAmt: "",
  coPrevAddr: "", coPrevCity: "", coPrevSt: "", coPrevZip: "", coPrevYrs: "", coPrevRent: "", coPrevAmt: "",
  coEmp: "", coEmpStr: "", coEmpCity: "", coEmpSt: "", coEmpZip: "", coPos: "", coGross: "", coYrsEmp: "",
  coPrevEmp: "", coPrevYrsEmp: "", coCarPmt: "", coCarTo: "", coSig: "", coSigDate: "",
});

export default function GenericExpressApp() {
  const [d, setD] = useState(BLANK());
  const [lender, setLender] = useState("");
  const [editingLender, setEditingLender] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pgMargin, setPgMargin] = useState(0.5);
  const ref = useRef<HTMLDivElement>(null);

  const s = (f: string) => (v: string) => setD(p => ({ ...p, [f]: v }));
  const handleClear = () => { if (confirm("Clear all fields?")) setD(BLANK()); };
  const handlePrint = () => window.print();
  const displayLender = lender.trim() || "LENDER NAME";
  const pageH = `calc(11in - ${(pgMargin * 2).toFixed(2)}in)`;

  const capture = async (scale = 2) => {
    if (!ref.current) return null;
    ref.current.classList.add("hide-ui");
    const c = await html2canvas(ref.current, { scale, useCORS: true, logging: false, backgroundColor: "#ffffff" });
    ref.current.classList.remove("hide-ui");
    return c;
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const c = await capture(2);
      if (!c) return;
      const pdf = new jsPDF("p", "mm", "letter");
      pdf.addImage(c.toDataURL("image/png", 1.0), "PNG", 0, 0,
        pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), undefined, "FAST");
      pdf.save(`Express_App_${lender || "Lender"}_${d.name || "Applicant"}.pdf`);
    } finally { setBusy(false); }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const c = await capture(1.5);
      if (!c) return;
      const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!), "image/png"));
      const file = new File([blob], `Express_App_${d.name || "App"}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Express Application" });
      else alert("Use Download PDF to save.");
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-slate-950 min-h-screen font-sans print:bg-white">
      <style>{`
        @media print {
          @page { size: letter; margin: ${pgMargin}in; }
          body { margin:0 !important; background:#fff !important; }
          .no-print { display:none !important; }
          .lender-hint { display:none !important; }
          .paper-form {
            width:100% !important;
            height:${pageH} !important;
            min-height:0 !important;
            box-shadow:none !important;
            margin:0 !important;
            padding:0 !important;
            display:flex !important;
            flex-direction:column !important;
          }
        }
        .hide-ui .no-print { display:none !important; }
        .hide-ui .lender-hint { display:none !important; }
      `}</style>

      <nav className="no-print bg-slate-900 fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-8 py-3 border-b border-white/5 shadow-2xl">
        <Link href="/forms" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Forms</span>
        </Link>
        <div className="text-base font-black tracking-tighter text-white uppercase italic">Express App — Generic Lender</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded border border-white/10">
            <button onClick={() => setPgMargin(m => Math.max(0.25, parseFloat((m - 0.25).toFixed(2))))}
              className="text-white/60 hover:text-white w-4 text-center font-bold leading-none">−</button>
            <span className="text-[9px] text-white/70 w-6 text-center tabular-nums">{pgMargin}"</span>
            <button onClick={() => setPgMargin(m => Math.min(1.0, parseFloat((m + 0.25).toFixed(2))))}
              className="text-white/60 hover:text-white w-4 text-center font-bold leading-none">+</button>
            <span className="text-[8px] text-white/30 uppercase tracking-wider ml-0.5">margin</span>
          </div>
          <button onClick={handleClear} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-red-900 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors">
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors">
            <Printer className="w-3 h-3" /> Print
          </button>
          <button onClick={handleDownload} disabled={busy} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
          </button>
          <button onClick={handleShare} disabled={busy} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50">
            <Share2 className="w-3 h-3" /> Share
          </button>
        </div>
      </nav>

      <main className="pt-16 pb-10 px-4 flex justify-center print:pt-0 print:pb-0 print:px-0">
        <div ref={ref} className="paper-form bg-white text-black border-2 border-black"
          style={{ width: "7.5in", minHeight: "10in", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>

          {/* ── Header ── */}
          <div className="flex items-stretch border-b-2 border-black flex-none">
            <div className="flex-1 p-2 border-r-2 border-black">
              <div className="text-[16px] font-black uppercase tracking-wide leading-none">EXPRESS APPLICATION</div>
              <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5 leading-none">APLICACIÓN RÁPIDA</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-[7px] font-bold uppercase whitespace-nowrap">AMOUNT REQUESTED / CANTIDAD SOLICITADA:</span>
                <input value={d.amt} onChange={e => s("amt")(e.target.value)}
                  className="border-b border-black bg-transparent text-[9px] font-semibold outline-none flex-1 min-w-0" />
              </div>
            </div>
            {/* Editable lender name */}
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
                    style={{ fontFamily: "Georgia, serif", fontStyle: lender ? "italic" : "normal" }}>
                    {displayLender}
                  </div>
                  <div className="lender-hint mt-0.5 flex items-center justify-center gap-0.5 text-[6px] font-bold uppercase text-black/25 group-hover:text-black/50 transition-colors">
                    <Pencil className="w-2 h-2" /> click to edit
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Column headers ── */}
          <div className="grid grid-cols-2 border-b border-black flex-none">
            <div className="p-[3px] border-r border-black text-[7px] font-black uppercase tracking-widest">APPLICANT</div>
            <div className="p-[3px] text-[7px] font-black uppercase tracking-widest">CO-APPLICANT</div>
          </div>

          {/* ── Body — stretches to fill page ── */}
          <div className="grid grid-cols-2" style={{ flex: 1, gridAutoRows: "1fr" }}>

            <Cell><F label="APPLICANT'S NAME / NOMBRE DE PRESTATARIO" value={d.name} onChange={s("name")} /></Cell>
            <Cell right><F label="CO-APPLICANT'S NAME / NOMBRE DE CO-PRESTATARIO" value={d.coName} onChange={s("coName")} /></Cell>

            <Cell>
              <div className="grid grid-cols-2 h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="SSN/ITIN" value={d.ssn} onChange={s("ssn")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="DATE OF BIRTH / FECHA DE NACIMIENTO" value={d.dob} onChange={s("dob")} /></div>
              </div>
            </Cell>
            <Cell right>
              <div className="grid grid-cols-2 h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="SSN/ITIN" value={d.coSsn} onChange={s("coSsn")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="DATE OF BIRTH / FECHA DE NACIMIENTO" value={d.coDob} onChange={s("coDob")} /></div>
              </div>
            </Cell>

            <Cell>
              <div className="grid grid-cols-2 h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="PHONE/NÚMERO DE TELÉFONO" value={d.phone} onChange={s("phone")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="WORK NUMBER / NÚMERO DE TRABAJO" value={d.work} onChange={s("work")} /></div>
              </div>
            </Cell>
            <Cell right>
              <div className="grid grid-cols-2 h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="PHONE/NÚMERO DE TELÉFONO" value={d.coPhone} onChange={s("coPhone")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="WORK NUMBER / NÚMERO DE TRABAJO" value={d.coWork} onChange={s("coWork")} /></div>
              </div>
            </Cell>

            <Cell><F label="EMAIL ADDRESS / CORREO ELECTRÓNICO" value={d.email} onChange={s("email")} /></Cell>
            <Cell right><F label="EMAIL ADDRESS / CORREO ELECTRÓNICO" value={d.coEmail} onChange={s("coEmail")} /></Cell>

            <Cell><F label="STREET ADDRESS / DIRECCIÓN" value={d.addr} onChange={s("addr")} /></Cell>
            <Cell right><F label="STREET ADDRESS / DIRECCIÓN" value={d.coAddr} onChange={s("coAddr")} /></Cell>

            <Cell>
              <div className="grid grid-cols-[2fr_1fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d.city} onChange={s("city")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE / ESTADO" value={d.st} onChange={s("st")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="ZIP / CÓDIGO POSTAL" value={d.zip} onChange={s("zip")} /></div>
              </div>
            </Cell>
            <Cell right>
              <div className="grid grid-cols-[2fr_1fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d.coCity} onChange={s("coCity")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE / ESTADO" value={d.coSt} onChange={s("coSt")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="ZIP / CÓDIGO POSTAL" value={d.coZip} onChange={s("coZip")} /></div>
              </div>
            </Cell>

            <Cell>
              <div className="grid grid-cols-[2fr_2fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE / AÑOS/MESES DE RESIDENCIA" value={d.yrs} onChange={s("yrs")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR MORTG? / ¿ALQUILER O PROPIO?" value={d.rentMortg} onChange={s("rentMortg")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT / $PAGO MENSUAL" value={d.rentAmt} onChange={s("rentAmt")} /></div>
              </div>
            </Cell>
            <Cell right>
              <div className="grid grid-cols-[2fr_2fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE / AÑOS/MESES DE RESIDENCIA" value={d.coYrs} onChange={s("coYrs")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR MORTG? / ¿ALQUILER O PROPIO?" value={d.coRentMortg} onChange={s("coRentMortg")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT / $PAGO MENSUAL" value={d.coRentAmt} onChange={s("coRentAmt")} /></div>
              </div>
            </Cell>

            <Cell><F label="PREVIOUS STREET ADDRESS (IF CURRENT ADDRESS < 2 YRS) / DIRECCIÓN ANTERIOR (SI LA DIRECCIÓN ACTUAL ES <2 AÑOS)" value={d.prevAddr} onChange={s("prevAddr")} /></Cell>
            <Cell right><F label="PREVIOUS STREET ADDRESS (IF CURRENT ADDRESS < 2 YRS) / DIRECCIÓN ANTERIOR (SI LA DIRECCIÓN ACTUAL ES <2 AÑOS)" value={d.coPrevAddr} onChange={s("coPrevAddr")} /></Cell>

            <Cell>
              <div className="grid grid-cols-[2fr_1fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d.prevCity} onChange={s("prevCity")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE / ESTADO" value={d.prevSt} onChange={s("prevSt")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="ZIP / CÓDIGO POSTAL" value={d.prevZip} onChange={s("prevZip")} /></div>
              </div>
            </Cell>
            <Cell right>
              <div className="grid grid-cols-[2fr_1fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d.coPrevCity} onChange={s("coPrevCity")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE / ESTADO" value={d.coPrevSt} onChange={s("coPrevSt")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="ZIP / CÓDIGO POSTAL" value={d.coPrevZip} onChange={s("coPrevZip")} /></div>
              </div>
            </Cell>

            <Cell>
              <div className="grid grid-cols-[2fr_2fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE / AÑOS/MESES DE RESIDENCIA" value={d.prevYrs} onChange={s("prevYrs")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR OWN? / ¿ALQUILER O PROPIO?" value={d.prevRent} onChange={s("prevRent")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT / $PAGO MENSUAL" value={d.prevAmt} onChange={s("prevAmt")} /></div>
              </div>
            </Cell>
            <Cell right>
              <div className="grid grid-cols-[2fr_2fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="YRS/MOS AT RESIDENCE / AÑOS/MESES DE RESIDENCIA" value={d.coPrevYrs} onChange={s("coPrevYrs")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="RENT OR OWN? / ¿ALQUILER O PROPIO?" value={d.coPrevRent} onChange={s("coPrevRent")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="$AMOUNT / $PAGO MENSUAL" value={d.coPrevAmt} onChange={s("coPrevAmt")} /></div>
              </div>
            </Cell>

            <Cell><F label="EMPLOYER (OR SOURCE OF INCOME) / EMPLEADOR (FUENTE DE INGRESO)" value={d.emp} onChange={s("emp")} /></Cell>
            <Cell right><F label="EMPLOYER (OR SOURCE OF INCOME) / EMPLEADOR (FUENTE DE INGRESO)" value={d.coEmp} onChange={s("coEmp")} /></Cell>

            <Cell>
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="STREET ADDRESS / DIRECCIÓN" value={d.empStr} onChange={s("empStr")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d.empCity} onChange={s("empCity")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.empSt} onChange={s("empSt")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.empZip} onChange={s("empZip")} /></div>
              </div>
            </Cell>
            <Cell right>
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="STREET ADDRESS / DIRECCIÓN" value={d.coEmpStr} onChange={s("coEmpStr")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="CITY / CIUDAD" value={d.coEmpCity} onChange={s("coEmpCity")} /></div>
                <div className="border-r border-black/40 px-1 flex flex-col justify-center"><F label="STATE" value={d.coEmpSt} onChange={s("coEmpSt")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="ZIP" value={d.coEmpZip} onChange={s("coEmpZip")} /></div>
              </div>
            </Cell>

            <Cell>
              <div className="grid grid-cols-2 h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="POSITION/TITLE / POSICIÓN/TÍTULO" value={d.pos} onChange={s("pos")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="GROSS INCOME (FREQUENCY) / INGRESO BRUTO (FRECUENCIA)" value={d.gross} onChange={s("gross")} /></div>
              </div>
            </Cell>
            <Cell right>
              <div className="grid grid-cols-2 h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="POSITION/TITLE / POSICIÓN/TÍTULO" value={d.coPos} onChange={s("coPos")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="GROSS INCOME (FREQUENCY) / INGRESO BRUTO (FRECUENCIA)" value={d.coGross} onChange={s("coGross")} /></div>
              </div>
            </Cell>

            <Cell><F label="YRS/MOS OF EMPLOYMENT / AÑOS/MESES DE EMPLEO" value={d.yrsEmp} onChange={s("yrsEmp")} /></Cell>
            <Cell right><F label="YRS/MOS OF EMPLOYMENT / AÑOS/MESES DE EMPLEO" value={d.coYrsEmp} onChange={s("coYrsEmp")} /></Cell>

            <Cell><F label="PREVIOUS EMPLOYER (IF CURRENT EMPLOYER < 2 YRS) / EMPLEADOR ANTERIOR (SI EL EMPLEADOR ACTUAL ES <2 AÑOS)" value={d.prevEmp} onChange={s("prevEmp")} /></Cell>
            <Cell right><F label="PREVIOUS EMPLOYER (IF CURRENT EMPLOYER < 2 YRS) / EMPLEADOR ANTERIOR (SI EL EMPLEADOR ACTUAL ES <2 AÑOS)" value={d.coPrevEmp} onChange={s("coPrevEmp")} /></Cell>

            <Cell><F label="YRS/MOS OF EMPLOYMENT / AÑOS/MESES DE EMPLEO" value={d.prevYrsEmp} onChange={s("prevYrsEmp")} /></Cell>
            <Cell right><F label="YRS/MOS OF EMPLOYMENT / AÑOS/MESES DE EMPLEO" value={d.coPrevYrsEmp} onChange={s("coPrevYrsEmp")} /></Cell>

            <Cell noBorderB>
              <div className="grid grid-cols-[3fr_2fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="MONTHLY CAR PAYMENT(S) / PAGOS MENSUALES DE AUTO" value={d.carPmt} onChange={s("carPmt")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="TO WHOM / ¿A QUIÉN?" value={d.carTo} onChange={s("carTo")} /></div>
              </div>
            </Cell>
            <Cell right noBorderB>
              <div className="grid grid-cols-[3fr_2fr] h-full">
                <div className="border-r border-black/40 pr-1 flex flex-col justify-center"><F label="MONTHLY CAR PAYMENT(S) / PAGOS MENSUALES DE AUTO" value={d.coCarPmt} onChange={s("coCarPmt")} /></div>
                <div className="pl-1 flex flex-col justify-center"><F label="TO WHOM / ¿A QUIÉN?" value={d.coCarTo} onChange={s("coCarTo")} /></div>
              </div>
            </Cell>
          </div>

          {/* ── Signatures ── */}
          <div className="grid grid-cols-2 border-t-2 border-black flex-none">
            <div className="border-r border-black p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div>
                <div className="text-[6px] font-black uppercase leading-none">APPLICANT'S SIGNATURE / FIRMA DEL PRESTATARIO</div>
                <input value={d.sig} onChange={e => s("sig")(e.target.value)}
                  className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" />
              </div>
              <div>
                <div className="text-[6px] font-black uppercase leading-none">DATE / FECHA</div>
                <input value={d.sigDate} onChange={e => s("sigDate")(e.target.value)}
                  className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" />
              </div>
            </div>
            <div className="p-[3px] grid grid-cols-[3fr_1fr] gap-1">
              <div>
                <div className="text-[6px] font-black uppercase leading-none">CO-APPLICANT'S SIGNATURE / FIRMA DEL PRESTATARIO</div>
                <input value={d.coSig} onChange={e => s("coSig")(e.target.value)}
                  className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" />
              </div>
              <div>
                <div className="text-[6px] font-black uppercase leading-none">DATE / FECHA</div>
                <input value={d.coSigDate} onChange={e => s("coSigDate")(e.target.value)}
                  className="border-b border-black bg-transparent text-[9px] outline-none w-full mt-0.5" />
              </div>
            </div>
          </div>

          {/* ── Dynamic disclaimer ── */}
          <div className="border-t border-black p-2 text-[6.5px] leading-snug text-black flex-none">
            <p className="font-semibold">I hereby authorize {displayLender} to request my credit report from a credit reporting agency.</p>
            <p className="mt-0.5">Autorizo a {displayLender} que solicite mi reporte de crédito de una agencia de crédito.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
