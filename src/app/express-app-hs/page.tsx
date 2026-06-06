"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, Download, Share2, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Compact bilingual field ──────────────────────────────────────────────────
const F = ({
  label, value, onChange, className = "", ...rest
}: { label: string; value: string; onChange: (v: string) => void; className?: string; [k: string]: any }) => (
  <div className={`flex flex-col min-w-0 ${className}`}>
    <span className="text-[5.5px] font-bold uppercase text-black leading-none mb-[1px] truncate">{label}</span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border-b border-black/60 bg-transparent text-[9px] font-medium text-black outline-none w-full min-w-0 pb-px leading-none"
      {...rest}
    />
  </div>
);

// ─── One applicant column ─────────────────────────────────────────────────────
const ApplicantColumn = ({
  prefix, label, d, set
}: { prefix: string; label: string; d: Record<string, string>; set: (f: string) => (v: string) => void }) => (
  <div className="flex flex-col gap-[3px] p-1 min-w-0">
    <F label={label} value={d[`${prefix}name`]} onChange={set(`${prefix}name`)} className="mb-[2px]" />
    <div className="grid grid-cols-2 gap-[3px]">
      <F label="SSN/ITIN" value={d[`${prefix}ssn`]} onChange={set(`${prefix}ssn`)} />
      <F label="DATE OF BIRTH / FECHA DE NACIMIENTO" value={d[`${prefix}dob`]} onChange={set(`${prefix}dob`)} />
    </div>
    <div className="grid grid-cols-2 gap-[3px]">
      <F label="PHONE/NÚMERO DE TELÉFONO" value={d[`${prefix}phone`]} onChange={set(`${prefix}phone`)} />
      <F label="WORK NUMBER / NÚMERO DE TRABAJO" value={d[`${prefix}work`]} onChange={set(`${prefix}work`)} />
    </div>
    <F label="EMAIL ADDRESS / CORREO ELECTRÓNICO" value={d[`${prefix}email`]} onChange={set(`${prefix}email`)} />
    <F label="STREET ADDRESS / DIRECCIÓN" value={d[`${prefix}address`]} onChange={set(`${prefix}address`)} />
    <div className="grid grid-cols-[2fr_1fr_1fr] gap-[3px]">
      <F label="CITY / CIUDAD" value={d[`${prefix}city`]} onChange={set(`${prefix}city`)} />
      <F label="STATE / ESTADO" value={d[`${prefix}state`]} onChange={set(`${prefix}state`)} />
      <F label="ZIP / CÓDIGO POSTAL" value={d[`${prefix}zip`]} onChange={set(`${prefix}zip`)} />
    </div>
    <div className="grid grid-cols-[2fr_2fr_1fr] gap-[3px]">
      <F label="YRS/MOS AT RESIDENCE / AÑOS/MESES DE RESIDENCIA" value={d[`${prefix}yrsRes`]} onChange={set(`${prefix}yrsRes`)} />
      <F label="RENT OR MORTG? / ¿ALQUILER O PROPIO?" value={d[`${prefix}rentMortg`]} onChange={set(`${prefix}rentMortg`)} />
      <F label="$AMOUNT / $PAGO MENSUAL" value={d[`${prefix}rentAmt`]} onChange={set(`${prefix}rentAmt`)} />
    </div>
    <F label="PREVIOUS STREET ADDRESS (IF CURRENT ADDRESS IS LESS THAN 2 YEARS) / DIRECCIÓN ANTERIOR (SI LA DIRECCIÓN ACTUAL ES <2 AÑOS)" value={d[`${prefix}prevAddress`]} onChange={set(`${prefix}prevAddress`)} />
    <div className="grid grid-cols-[2fr_1fr_1fr] gap-[3px]">
      <F label="CITY / CIUDAD" value={d[`${prefix}prevCity`]} onChange={set(`${prefix}prevCity`)} />
      <F label="STATE / ESTADO" value={d[`${prefix}prevState`]} onChange={set(`${prefix}prevState`)} />
      <F label="ZIP / CÓDIGO POSTAL" value={d[`${prefix}prevZip`]} onChange={set(`${prefix}prevZip`)} />
    </div>
    <div className="grid grid-cols-[2fr_2fr_1fr] gap-[3px]">
      <F label="YRS/MOS AT RESIDENCE / AÑOS/MESES DE RESIDENCIA" value={d[`${prefix}prevYrsRes`]} onChange={set(`${prefix}prevYrsRes`)} />
      <F label="RENT OR OWN? / ¿ALQUILER O PROPIO?" value={d[`${prefix}prevRentOwn`]} onChange={set(`${prefix}prevRentOwn`)} />
      <F label="$AMOUNT / $PAGO MENSUAL" value={d[`${prefix}prevRentAmt`]} onChange={set(`${prefix}prevRentAmt`)} />
    </div>
    <F label="EMPLOYER (OR SOURCE OF INCOME) / EMPLEADOR (FUENTE DE INGRESO)" value={d[`${prefix}employer`]} onChange={set(`${prefix}employer`)} />
    <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-[3px]">
      <F label="STREET ADDRESS / DIRECCIÓN" value={d[`${prefix}empStreet`]} onChange={set(`${prefix}empStreet`)} />
      <F label="CITY / CIUDAD" value={d[`${prefix}empCity`]} onChange={set(`${prefix}empCity`)} />
      <F label="STATE / ESTADO" value={d[`${prefix}empState`]} onChange={set(`${prefix}empState`)} />
      <F label="ZIP / CÓDIGO POSTAL" value={d[`${prefix}empZip`]} onChange={set(`${prefix}empZip`)} />
    </div>
    <div className="grid grid-cols-2 gap-[3px]">
      <F label="POSITION/TITLE / POSICIÓN/TÍTULO" value={d[`${prefix}position`]} onChange={set(`${prefix}position`)} />
      <F label="GROSS INCOME (FREQUENCY) / INGRESO BRUTO (FRECUENCIA)" value={d[`${prefix}grossIncome`]} onChange={set(`${prefix}grossIncome`)} />
    </div>
    <F label="YRS/MOS OF EMPLOYMENT / AÑOS/MESES DE EMPLEO" value={d[`${prefix}yrsEmp`]} onChange={set(`${prefix}yrsEmp`)} />
    <F label="PREVIOUS EMPLOYER (IF CURRENT EMPLOYER IS LESS THAN 2 YEARS) / EMPLEADOR ANTERIOR(SI EL EMPLEADOR ACTUAL ES <2 AÑOS)" value={d[`${prefix}prevEmployer`]} onChange={set(`${prefix}prevEmployer`)} />
    <F label="YRS/MOS OF EMPLOYMENT / AÑOS/MESES DE EMPLEO" value={d[`${prefix}prevYrsEmp`]} onChange={set(`${prefix}prevYrsEmp`)} />
    <div className="grid grid-cols-[2fr_1fr] gap-[3px]">
      <F label="MONTHLY CAR PAYMENT(S) / PAGOS MENSUALES DE AUTO" value={d[`${prefix}carPayment`]} onChange={set(`${prefix}carPayment`)} />
      <F label="TO WHOM / ¿A QUIÉN?" value={d[`${prefix}carPayTo`]} onChange={set(`${prefix}carPayTo`)} />
    </div>
  </div>
);

// ─── Initial form state ───────────────────────────────────────────────────────
const INITIAL = () => ({
  amountRequested: "",
  name: "", ssn: "", dob: "", phone: "", work: "", email: "", address: "",
  city: "", state: "", zip: "", yrsRes: "", rentMortg: "", rentAmt: "",
  prevAddress: "", prevCity: "", prevState: "", prevZip: "", prevYrsRes: "",
  prevRentOwn: "", prevRentAmt: "", employer: "", empStreet: "", empCity: "",
  empState: "", empZip: "", position: "", grossIncome: "", yrsEmp: "",
  prevEmployer: "", prevYrsEmp: "", carPayment: "", carPayTo: "", signature: "", sigDate: "",
  // Co-applicant
  coname: "", cossn: "", codob: "", cophone: "", cowork: "", coemail: "", coaddress: "",
  cosity: "", costate: "", cozip: "", coyrsRes: "", corentMortg: "", corentAmt: "",
  coprevAddress: "", coprevCity: "", coprevState: "", coprevZip: "", coprevYrsRes: "",
  coprevRentOwn: "", coprevRentAmt: "", coemployer: "", coempStreet: "", coempCity: "",
  coempState: "", coempZip: "", coposition: "", cogrossIncome: "", coyrsEmp: "",
  coprevEmployer: "", coprevYrsEmp: "", cocarPayment: "", cocarPayTo: "", cosignature: "", cosigDate: "",
});

export default function HeritageSouthExpressApp() {
  const [form, setForm] = useState(INITIAL());
  const [busy, setBusy] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const set = (field: string) => (val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

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
      pdf.save(`Express_App_HS_${form.name || "Applicant"}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!captureRef.current) return;
    setBusy(true);
    try {
      captureRef.current.classList.add("hide-buttons-for-pdf");
      const canvas = await html2canvas(captureRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
      captureRef.current.classList.remove("hide-buttons-for-pdf");
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/png"));
      const file = new File([blob], `Express_App_${form.name || "Applicant"}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Express Application" });
      } else {
        alert("Sharing not supported on this device. Use Download PDF instead.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans print:bg-white print:min-h-0">
      <style>{`
        @media print {
          @page { size: letter; margin: 0.35in; }
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
        <div className="text-lg font-black tracking-tighter text-white uppercase italic">Express App — Heritage South</div>
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

      {/* Form */}
      <main className="pt-24 pb-16 px-4 print:pt-0 print:pb-0 print:px-0">
        <div
          ref={captureRef}
          className="paper-form bg-white text-black w-full max-w-[900px] mx-auto shadow-2xl print:max-w-none print:shadow-none"
        >
          {/* ── Header ── */}
          <div className="flex justify-between items-start border-b-2 border-black pb-1 mb-1 px-2 pt-2">
            <div>
              <h1 className="text-[18px] font-black uppercase tracking-wide leading-none">EXPRESS APPLICATION</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase leading-none mt-0.5">APLICACIÓN RÁPIDA</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[7px] font-bold uppercase">AMOUNT REQUESTED / CANTIDAD SOLICITADA:</span>
                <input
                  value={form.amountRequested}
                  onChange={e => set("amountRequested")(e.target.value)}
                  className="border-b border-black bg-transparent text-[9px] font-semibold outline-none w-24 pb-px"
                />
              </div>
            </div>
            {/* Heritage South branding */}
            <div className="border-2 border-black px-3 py-1.5 text-center leading-none min-w-[120px]">
              <div className="text-[15px] font-black italic">Heritage</div>
              <div className="flex items-center justify-center gap-1">
                <div className="text-[4px] text-black">✦✦✦</div>
                <div className="text-[13px] font-black tracking-wider">South</div>
                <div className="text-[4px] text-black">✦✦✦</div>
              </div>
              <div className="text-[6px] font-bold tracking-widest uppercase mt-0.5">COMMUNITY CREDIT UNION</div>
            </div>
          </div>

          {/* ── Two-column body ── */}
          <div className="grid grid-cols-2 divide-x-2 divide-black border border-black">
            <ApplicantColumn prefix="" label="APPLICANT'S NAME / NOMBRE DE PRESTATARIO" d={form} set={set} />
            <ApplicantColumn prefix="co" label="CO-APPLICANT'S NAME / NOMBRE DE CO-PRESTATARIO" d={form} set={set} />
          </div>

          {/* ── Signature row ── */}
          <div className="grid grid-cols-2 divide-x border-x border-b border-black">
            <div className="grid grid-cols-[2fr_1fr] gap-2 p-1">
              <F label="APPLICANT'S SIGNATURE / FIRMA DEL PRESTATARIO" value={form.signature} onChange={set("signature")} />
              <F label="DATE / FECHA" value={form.sigDate} onChange={set("sigDate")} />
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-2 p-1">
              <F label="CO-APPLICANT'S SIGNATURE / FIRMA DEL PRESTATARIO" value={form.cosignature} onChange={set("cosignature")} />
              <F label="DATE / FECHA" value={form.cosigDate} onChange={set("cosigDate")} />
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <div className="px-2 py-1 text-[6.5px] font-medium text-black leading-snug">
            <p>I hereby authorize Heritage South Community Credit Union to request my credit report from a credit reporting agency.</p>
            <p className="mt-0.5">Autorizo a Heritage South Community Credit Union que solicite mi reporte de crédito de una agencia de crédito.</p>
            <div className="grid grid-cols-2 gap-x-4 mt-1 text-[6px]">
              <div>HSCCU Shelbyville, email to loan@heritagesouth.org</div>
              <div>HSCCU Lewisburg, email to Email-LewisburLenders@heritagesouth.org</div>
              <div>HSCCU Manchester, email to EMAIL-MANCHESTER@heritagesouth.org</div>
              <div>HSCCU Fayetteville, email to EMAIL-FAYETTEVILLE@heritagesouth.org</div>
              <div>HSCCU Smyrna, email to EMAIL-SMYRNA@heritagesouth.org</div>
              <div>HSCCU MLK, email to EMAIL-MERCURY@heritagesouth.org</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
