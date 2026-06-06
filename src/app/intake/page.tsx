"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  QrCode, 
  Car, 
  CreditCard, 
  CheckSquare, 
  Droplet, 
  Wrench, 
  Share2, 
  Printer, 
  Save, 
  Bell, 
  Settings,
  Phone,
  FileText,
  AlertTriangle,
  Clipboard,
  Mail,
  Camera,
  X,
  Zap,
  RefreshCw,
  Download,
  ShieldCheck,
  FileBox,
  Loader2,
  CheckCircle2,
  ZapOff,
  FileClock,
  RotateCcw
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createWorker } from "tesseract.js";
import { Html5Qrcode } from "html5-qrcode";
import { generateWordDoc } from "@/lib/reports";
import { FormData, CHECKLIST_LEFT, CHECKLIST_RIGHT } from "@/types/inspection";
import { PrintableReport } from "@/components/PrintableReport";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const REAL_TIME_SCANNER_ID = "vin-scanner-viewfinder";

const EMPTY_FORM = (): FormData => ({
  year: "",
  make: "",
  modelPkg: "",
  body: "",
  miles: "",
  color: "",
  autoManual: "",
  vin: "",
  purchasedFrom: "",
  paid: "",
  price: "",
  down: "",
  remarks: "",
  signature: "",
  date: new Date().toISOString().split('T')[0],
  checklist: [...CHECKLIST_LEFT, ...CHECKLIST_RIGHT].reduce((acc, item) => ({ ...acc, [item]: false }), {}),
});

export default function VinScannerForm() {
  const [isDecoding, setIsDecoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(true);
  
  const [showScannerModal, setShowScannerModal] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanLoopRef = useRef<number | null>(null);

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM());

  const [duplicateRecord, setDuplicateRecord] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load Edit Data on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const editData = localStorage.getItem("edit_inspection_data");
      if (editData) {
        try {
          const parsed = JSON.parse(editData);
          if (parsed.formData.signature === "SYSTEM_IMPORT") {
            parsed.formData.signature = "";
          }
          setFormData(parsed.formData);
          setEditingId(parsed.id);
          localStorage.removeItem("edit_inspection_data");
        } catch (e) {
          console.error("Failed to load edit data", e);
        }
      }
    }
  }, []);

  const checkDuplicateVin = async (vin: string) => {
    if (vin.length < 11 || editingId) return;
    try {
      const res = await fetch(`/api/inspection?vin=${vin}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setDuplicateRecord(data[0]);
        } else {
          setDuplicateRecord(null);
        }
      }
    } catch (e) {
      console.error("Duplicate check failed", e);
    }
  };

  const handleSave = async (paidOverride?: string) => {
    setIsSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const dataToSave = paidOverride ? { ...formData, paid: paidOverride } : formData;
      const payload = editingId ? { ...dataToSave, id: editingId } : dataToSave;
      
      const res = await fetch('/api/inspection', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const result = await res.json();
        const id = editingId || result.id;
        
        const sessionIds = JSON.parse(localStorage.getItem("session_ids") || "[]");
        if (!sessionIds.includes(id)) {
          sessionIds.push(id);
          localStorage.setItem("session_ids", JSON.stringify(sessionIds));
        }

        alert(editingId ? "Update Logged." : "Audit Logged. Form cleared — ready for next vehicle.");
        localStorage.removeItem("edit_inspection_data");
        setEditingId(null);
        setDuplicateRecord(null);
        setFormData(EMPTY_FORM());
      } else {
        const errData = await res.json();
        alert(`Save failed: ${errData.error || "Unknown database error. Check for duplicate VIN."}`);
      }
    } catch {
      alert("Network error — could not reach the database.");
    } finally { setIsSaving(false); }
  };

  const cancelEdit = () => {
    localStorage.removeItem("edit_inspection_data");
    setEditingId(null);
    setDuplicateRecord(null);
    setFormData(EMPTY_FORM());
  };

  const resetForm = () => {
    setEditingId(null);
    setDuplicateRecord(null);
    localStorage.removeItem("edit_inspection_data");
    setFormData(EMPTY_FORM());
  };

  const decodeVin = async (vin: string) => {
    if (!vin || vin.length < 11) return;
    setIsDecoding(true);
    await checkDuplicateVin(vin);
    
    try {
      const response = await fetch(`/api/vin?vin=${vin}`);
      const data = await response.json();
      
      // Support for Auto.dev API structure
      if (data.make || data.year) {
         setFormData(prev => ({ 
            ...prev, 
            vin: vin.toUpperCase(),
            year: String(data.years?.[0]?.year || data.year || prev.year || ""),
            make: String(data.make?.name || data.make || prev.make || ""),
            modelPkg: [
              String(data.model?.name || data.model || ""), 
              String(data.trim?.name || data.trim || data.years?.[0]?.styles?.[0]?.trim || "")
            ].filter(v => v && v !== "[object Object]").join(" ").trim() || prev.modelPkg,
            body: String(data.categories?.vehicleStyle || data.bodyType || data.body_type || prev.body || ""),
            autoManual: String(
               data.transmission?.transmissionType || 
               data.transmission?.name || 
               data.transmissionType || 
               (typeof data.transmission === 'string' ? data.transmission : "") || 
               prev.autoManual || 
               ""
            ),
         }));
      } 
      // Fallback for NHTSA format (already stringified in their response usually)
      else if (data.Results && data.Results[0]) {
         const vehicle = data.Results[0];
         setFormData(prev => ({ 
            ...prev, 
            vin: vin.toUpperCase(),
            year: String(vehicle.ModelYear || prev.year || ""),
            make: String(vehicle.Make || prev.make || ""),
            modelPkg: [vehicle.Model, vehicle.Trim].filter(Boolean).join(" ").trim() || prev.modelPkg,
            body: String(vehicle.BodyClass || prev.body || ""),
            autoManual: String(vehicle.TransmissionStyle || prev.autoManual || ""),
          }));
      }
    } catch (err) {
      console.error("Decode fail:", err);
    } finally { setIsDecoding(false); }
  };

  const startAdvancedScanner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        let lastOcrTime = 0;
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHJKLMNPRSTUVWXYZ',
        });

        const scan = async () => {
          if (!videoRef.current || !showScannerModal) {
             await worker.terminate();
             return;
          }

          try {
            if ("BarcodeDetector" in window) {
              // @ts-expect-error - BarcodeDetector is a newer browser API
              const detector = new window.BarcodeDetector({ formats: ["code_128", "code_39"] });
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                let vin = barcodes[0].rawValue.toUpperCase();
                vin = vin.replace(/^I|P|S/, "");
                const match = vin.match(/[A-HJ-NPR-Z0-9]{11,17}/);
                if (match) { decodeVin(match[0]); setShowScannerModal(false); stopScanner(); return; }
              }
            }

            const now = Date.now();
            if (now - lastOcrTime > 1200) {
              lastOcrTime = now;
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (ctx && videoRef.current) {
                const v = videoRef.current;
                canvas.width = v.videoWidth;
                canvas.height = v.videoHeight;
                ctx.drawImage(v, 0, 0);
                
                const { data: { text } } = await worker.recognize(canvas);
                const cleanText = text.toUpperCase()
                  .replace(/[\s\n]/g, "")
                  .replace(/O/g, "0")
                  .replace(/I/g, "1")
                  .replace(/Q/g, "0")
                  .replace(/[^A-Z0-9]/g, "");

                const longMatch = cleanText.match(/[A-HJ-NPR-Z0-9]{17}/);
                const shortMatch = cleanText.match(/[A-HJ-NPR-Z0-9]{11,17}/);
                const finalMatch = longMatch?.[0] || shortMatch?.[0];
                
                if (finalMatch) {
                  decodeVin(finalMatch);
                  setShowScannerModal(false);
                  stopScanner();
                  await worker.terminate();
                  return;
                }
              }
            }
          } catch (e) {}
          scanLoopRef.current = requestAnimationFrame(scan);
        };
        scanLoopRef.current = requestAnimationFrame(scan);
      }
    } catch (err) { console.error("Scanner failed:", err); setScannerSupported(false); }
  }, [showScannerModal]);

  const stopScanner = useCallback(() => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    if (scannerRef.current?.isScanning) { scannerRef.current.stop(); }
  }, []);

  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    const track = stream?.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const constraints = { advanced: [{ torch: !torchOn }] };
        await (track as MediaStreamTrack).applyConstraints(constraints as MediaTrackConstraints);
        setTorchOn(!torchOn);
      } catch { alert("Torch not supported on this camera."); }
    }
  };

  useEffect(() => {
    if (showScannerModal) startAdvancedScanner();
    else stopScanner();
    return () => stopScanner();
  }, [showScannerModal, startAdvancedScanner, stopScanner]);

  const shareWordRecord = async () => {
    const blob = await generateWordDoc(formData);
    const file = new File([blob], `Inspection_${formData.vin || 'Record'}.docx`, { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Inspection: ${formData.vin}`,
          text: `Professional Intake Record for ${formData.year} ${formData.make} ${formData.modelPkg}`
        });
        setShowShareOptions(false);
      } catch (err: unknown) { 
        if (err instanceof Error && err.name !== 'AbortError') {
          alert("Sharing failed. Try downloading."); 
        }
      }
    } else {
      alert("Attachment sharing not supported on this browser. Use 'Download' and attach manually.");
    }
  };

  const markAsProcessed = (id: string) => {
    const processed = JSON.parse(localStorage.getItem("processed_ids") || "[]");
    if (!processed.includes(id)) {
      processed.push(id);
      localStorage.setItem("processed_ids", JSON.stringify(processed));
    }
  };

  const printNativePdf = async () => {
    setIsSaving(true);
    try {
      // Auto-commit to DB before printing so no record is ever lost
      let savedId = editingId;
      if (!savedId) {
        const res = await fetch('/api/inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const result = await res.json();
          savedId = result.id;
          setEditingId(result.id);
          const sessionIds = JSON.parse(localStorage.getItem("session_ids") || "[]");
          if (!sessionIds.includes(result.id)) {
            sessionIds.push(result.id);
            localStorage.setItem("session_ids", JSON.stringify(sessionIds));
          }
        } else {
          const err = await res.json();
          alert(`Auto-save failed before print: ${err.error || "Unknown error."}`);
          return;
        }
      }

      const { generateNativePdf } = await import("@/lib/pdfEngine");
      const pdfBlob = await generateNativePdf(formData);

      const url = URL.createObjectURL(pdfBlob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
      };

      if (savedId) markAsProcessed(savedId);
    } catch (e) {
      console.error("Print Fail:", e);
      alert("Error preparing exact PDF for print.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPdfReport = async () => {
    setIsSaving(true);
    try {
      const { generateNativePdf } = await import("@/lib/pdfEngine");
      const pdfBlob = await generateNativePdf(formData);
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Inspection_${formData.vin || 'Record'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      if (editingId) markAsProcessed(editingId);
    } catch (e) { 
      console.error("PDF Fail:", e);
      alert("Error generating native PDF."); 
    } finally {
      setIsSaving(false);
    }
  };

  const emailPdfReport = async () => {
    setIsSaving(true);
    try {
      const { generateNativePdf } = await import("@/lib/pdfEngine");
      const pdfBlob = await generateNativePdf(formData);
      const file = new File([pdfBlob], `Inspection_${formData.vin || 'Record'}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Inspection: ${formData.vin}`,
          text: `Exact Inspection Record attached for VIN: ${formData.vin}`
        });
        setShowShareOptions(false);
      } else {
        alert("Mobile sharing API not supported on this browser. Use 'Download PDF' and attach it manually.");
      }
    } catch (e) {
      console.error("Email Fail:", e);
      alert("Error preparing email share.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center">
      {/* Off-screen container for PDF capture - using fixed positioning and large offset to ensure it renders correctly for html2canvas */}
      <div className="fixed top-[-9999px] left-[-9999px] no-print">
        <PrintableReport formData={formData} innerRef={captureRef} id="printable-form" />
      </div>

      <nav className="bg-slate-950 fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-4 border-b border-white/10 no-print shadow-xl">
        <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic cursor-pointer" onClick={() => window.location.href = '/'}>Right Price Auto Suite</div>
        <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-sm shadow-lg">RA</div>
      </nav>

      <main className="pt-24 pb-36 px-4 md:px-10 w-full max-w-7xl">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b-8 border-primary pb-12">
          <div className="space-y-1 w-full md:w-auto text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-primary leading-none">Vehicle Intake Ledger</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] text-outline uppercase pl-1">Authorized Audit Intelligence v4.0</p>
            {editingId && (
              <div className="mt-4 inline-flex items-center gap-4 bg-secondary text-white px-6 py-2 rounded-sm text-xs font-black uppercase italic animate-in slide-in-from-left">
                <span>Active Intelligence Revision Mode</span>
                <button onClick={cancelEdit} className="bg-white/20 hover:bg-white/40 rounded-sm p-1"><X className="w-4 h-4" /></button>
              </div>
            )}
            <div className="flex items-center justify-center md:justify-start gap-2 text-secondary font-bold text-lg pt-2 uppercase"><span>615-893-1727</span></div>
          </div>
          {isDecoding && <div className="flex items-center gap-3 text-secondary font-black uppercase text-[10px] animate-pulse"><Loader2 className="w-5 h-5 animate-spin" /> Hardware AI Decoding...</div>}
        </header>

        {duplicateRecord && (
          <div className="mb-10 bg-red-600/10 border-2 border-red-600 rounded-sm p-8 md:p-12 animate-in zoom-in slide-in-from-top-4">
             <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-sm bg-red-600 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-red-600/40">
                  <AlertTriangle className="w-12 h-12" />
                </div>
                <div className="flex-1 text-center md:text-left">
                   <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-red-600 leading-none mb-2">Duplicate Intelligence Warning</h2>
                   <p className="text-sm font-bold text-red-950/60 uppercase tracking-widest leading-relaxed">
                     Vehicle VIN <span className="text-red-600 font-black">{duplicateRecord.vin}</span> has a previous entry in the intelligence database.
                   </p>
                   <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="flex flex-col"><span className="text-[8px] font-bold text-red-900/40 uppercase">Last Intake</span><span className="text-xs font-black text-red-900">{duplicateRecord.inspection_date}</span></div>
                      <div className="flex flex-col"><span className="text-[8px] font-bold text-red-900/40 uppercase">Agent Name</span><span className="text-xs font-black text-red-900">{duplicateRecord.inspector_name || "N/A"}</span></div>
                      <div className="flex flex-col"><span className="text-[8px] font-bold text-red-900/40 uppercase">Mileage Log</span><span className="text-xs font-black text-red-900">{duplicateRecord.miles}</span></div>
                   </div>
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                  <button onClick={() => setDuplicateRecord(null)} className="w-full px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-sm hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20">Acknowledge</button>
                  <button onClick={() => {
                    localStorage.setItem("edit_inspection_data", JSON.stringify({
                      id: duplicateRecord.id,
                      formData: {
                        ...formData,
                        year: duplicateRecord.year,
                        make: duplicateRecord.make,
                        modelPkg: duplicateRecord.model,
                        body: duplicateRecord.body,
                        miles: duplicateRecord.miles,
                        color: duplicateRecord.color,
                        autoManual: duplicateRecord.transmission,
                        vin: duplicateRecord.vin,
                        purchasedFrom: duplicateRecord.purchased_from,
                        paid: duplicateRecord.paid_status,
                        price: duplicateRecord.price?.toString() || "",
                        down: duplicateRecord.down_payment?.toString() || "",
                        remarks: duplicateRecord.remarks || "",
                        signature: duplicateRecord.inspector_name || "",
                        date: duplicateRecord.inspection_date || "",
                        checklist: typeof duplicateRecord.checklist === 'string' ? JSON.parse(duplicateRecord.checklist) : duplicateRecord.checklist
                      }
                    }));
                    window.location.reload();
                  }} className="w-full px-8 py-4 bg-white border-2 border-red-600 text-red-600 font-black uppercase tracking-widest text-xs rounded-sm hover:bg-red-50 transition-all active:scale-95">Load Previous Intelligence</button>
                </div>
             </div>
          </div>
        )}

        <div className="mb-14 no-print flex justify-center md:justify-start">
          <button 
            onClick={() => setShowScannerModal(true)} 
            className="group relative bg-slate-900 border-4 border-primary text-white px-12 py-8 rounded-sm shadow-[0_20px_50px_rgba(245,158,11,0.3)] flex items-center justify-center gap-6 hover:bg-primary hover:text-white transition-all duration-500 overflow-hidden active:scale-95 w-full md:w-auto font-black leading-tight italic"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000" />
            <div className="p-3 bg-primary rounded-sm group-hover:bg-white group-hover:text-primary transition-all duration-500">
              <QrCode className="w-10 h-10" />
            </div>
            <div className="flex flex-col items-start leading-none text-left">
              <span className="text-2xl md:text-3xl tracking-tighter uppercase font-black">Intake Precision Scanner</span>
              <span className="text-[10px] tracking-[0.4em] font-bold uppercase mt-1 text-primary group-hover:text-white/80">Engage AI Hardware</span>
            </div>
          </button>
        </div>

        <form className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-14" onSubmit={e => e.preventDefault()}>
          <div className="lg:col-span-8 space-y-10 md:space-y-16">
            <div className="bg-white p-6 md:p-12 rounded-sm shadow-sm border-l-[16px] border-secondary border border-slate-100">
               <h3 className="text-xs font-black tracking-[0.2em] text-secondary uppercase mb-12 flex items-center gap-3"><Car className="w-6 h-6" /> Identity Profile</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10">
                  <div className="md:col-span-4 flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">VIN Intelligence</label>
                    <input 
                      className="modern-ledger-input px-6 py-6 text-primary font-black tracking-[0.4em] uppercase text-xl md:text-4xl rounded-sm bg-slate-50 border-none outline-none shadow-inner" 
                      placeholder="SCAN OR TYPE VIN" 
                      value={formData.vin} 
                      onChange={e => {
                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[IOQ]/g, (m) => m === 'O' ? '0' : m);
                        setFormData({...formData, vin: val}); 
                        if(val.length === 17) decodeVin(val); 
                      }} 
                    />
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pl-2">Standard 17-digit format • Automatic Decoding</p>
                  </div>
                 {[{l: "Year", k: "year"}, {l: "Make", k: "make"}, {l: "Model/Pkg", k: "modelPkg", c: 2}, {l: "Body", k: "body"}, {l: "Miles", k: "miles"}, {l: "Color", k: "color"}, {l: "Auto/Manual", k: "autoManual"}].map(f => (
                   <div key={f.k} className={cn("flex flex-col gap-2", f.c === 2 ? "md:col-span-2" : "md:col-span-1")}>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">{f.l}</label>
                     <input className="modern-ledger-input px-4 py-4 font-bold rounded-sm border border-slate-100 bg-slate-50 shadow-sm" value={formData[f.k as keyof FormData] as string} onChange={e => setFormData({...formData, [f.k]: e.target.value})} />
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-primary text-white p-6 md:p-12 rounded-sm shadow-2xl border border-white/10 ring-1 ring-white/5">
              <h3 className="text-xs font-black tracking-[0.2em] uppercase mb-12 flex items-center gap-3 opacity-80"><CreditCard className="w-6 h-6" /> Acquisition Log</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10">
                <div className="md:col-span-2 flex flex-col gap-2"><label className="text-[10px] font-black uppercase tracking-widest opacity-40">Purchased From</label><input className="bg-white/10 border-none px-4 py-4 font-bold rounded-sm text-white outline-none ring-1 ring-white/20" value={formData.purchasedFrom} onChange={e => setFormData({...formData, purchasedFrom: e.target.value})} /></div>
                <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase tracking-widest opacity-40">Price</label><input className="bg-white/10 border-none px-4 py-4 font-bold rounded-sm text-white outline-none ring-1 ring-white/20" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase tracking-widest opacity-40">Down</label><input className="bg-white/10 border-none px-4 py-4 font-bold rounded-sm text-white outline-none ring-1 ring-white/20" value={formData.down} onChange={e => setFormData({...formData, down: e.target.value})} /></div>
                <div className="md:col-span-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Paid Status</label>
                    <button 
                      onClick={() => setFormData({...formData, paid: "Purchased - PAID"}) }
                      className="text-[8px] font-black uppercase px-2 py-1 bg-white/20 rounded hover:bg-white/40 transition-all"
                    >
                      Quick Mark: Purchased
                    </button>
                  </div>
                  <input className="bg-white/10 border-none px-4 py-4 font-bold rounded-sm text-white outline-none ring-1 ring-white/20" value={formData.paid} onChange={e => setFormData({...formData, paid: e.target.value})} placeholder="e.g. Purchased, Paid, Pending..." />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10 md:space-y-16">
            <div className="bg-white p-6 md:p-11 rounded-sm shadow-xl border border-slate-200 ring-1 ring-slate-100">
              <h3 className="text-[10px] font-black uppercase mb-10 flex items-center gap-3 text-secondary tracking-widest"><CheckSquare className="w-6 h-6" /> Systems Check</h3>
              <div className="space-y-1">
                {CHECKLIST_LEFT.map(item => (
                  <label key={item} className="flex justify-between items-center p-3 hover:bg-slate-50 cursor-pointer rounded-sm transition-all"><span className="text-sm font-bold text-slate-700">{item.replace("( ) ", "")}</span><input type="checkbox" checked={formData.checklist[item]} onChange={() => setFormData({...formData, checklist: {...formData.checklist, [item]: !formData.checklist[item]}})} className="w-7 h-7 rounded-lg text-secondary border-slate-300" /></label>
                ))}
              </div>
            </div>

            <div className="bg-secondary text-white p-6 md:p-11 rounded-sm shadow-2xl ring-1 ring-white/10">
              <h3 className="text-[10px] font-black uppercase mb-10 tracking-widest opacity-80 flex items-center gap-3"><Droplet className="w-6 h-6" /> Fluid Authority</h3>
              <div className="space-y-1">
                {CHECKLIST_RIGHT.map(item => (
                  <label key={item} className="flex justify-between items-center p-3 hover:bg-white/10 rounded-sm transition-all cursor-pointer"><span className="text-sm font-bold">{item.replace("( ) ", "")}</span><input type="checkbox" checked={formData.checklist[item]} onChange={() => setFormData({...formData, checklist: {...formData.checklist, [item]: !formData.checklist[item]}})} className="w-7 h-7 border-white/30 bg-transparent rounded-lg" /></label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white p-6 md:p-12 rounded-sm shadow-sm border-l-[16px] border-slate-400 border border-slate-100">
             <h3 className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase mb-12 flex items-center gap-3"><FileText className="w-6 h-6" /> Execution Audit</h3>
             <textarea className="modern-ledger-input w-full p-6 md:p-10 min-h-[180px] font-bold text-lg rounded-sm mb-12 bg-slate-50" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Detailed vehicle condition notes..." />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 pt-10 border-t-4 border-slate-100">
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sign Log</label>
                  <input 
                    className="modern-ledger-input w-full h-24 px-10 text-2xl md:text-3xl font-light italic text-primary border-b-4 border-primary rounded-t-2xl bg-slate-50 shadow-inner font-serif overflow-hidden text-ellipsis whitespace-nowrap" 
                    value={formData.signature} 
                    onChange={e => setFormData({...formData, signature: e.target.value})} 
                  />
                </div>
                <div className="flex flex-col gap-4"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Audit Date</label><input type="date" className="modern-ledger-input w-full px-5 py-5 font-black rounded-sm bg-slate-50 shadow-inner" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
             </div>
          </div>
        </form>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t px-2 py-4 md:px-12 md:py-8 grid grid-cols-5 md:flex md:justify-center md:gap-10 z-50 no-print shadow-2xl">
        <button onClick={() => window.location.href = '/ledger'} className="px-1 md:px-8 py-4 bg-secondary/10 border-2 border-secondary text-secondary font-black uppercase tracking-widest text-[9px] md:text-sm rounded-sm flex flex-col md:flex-row items-center justify-center gap-1 active:scale-95 transition-all shadow-lg shadow-secondary/10"><FileClock className="w-5 h-5" /> <span>Ledger</span></button>
        <button onClick={() => setShowShareOptions(!showShareOptions)} className="px-1 md:px-8 py-4 border-2 border-primary text-primary font-black uppercase tracking-widest text-[9px] md:text-sm rounded-sm flex flex-col md:flex-row items-center justify-center gap-1 active:scale-95 transition-all"><Share2 className="w-5 h-5" /> <span>{showShareOptions ? "Close" : "Share"}</span></button>
        <button 
          onClick={() => handleSave("PURCHASED")}
          disabled={isSaving}
          className="px-1 md:px-8 py-4 bg-slate-900 border-2 border-secondary text-secondary font-black uppercase tracking-widest text-[9px] md:text-sm rounded-sm shadow-xl flex flex-col md:flex-row items-center justify-center gap-1 active:scale-95 transition-all group"
        >
          <Wrench className="w-5 h-5 group-hover:rotate-45 transition-transform" /> <span>To Lot Rot</span>
        </button>
        <button onClick={() => handleSave()} disabled={isSaving} className="px-1 md:px-12 py-4 bg-primary text-white font-black uppercase tracking-widest text-[9px] md:text-sm rounded-sm shadow-xl flex flex-col md:flex-row items-center justify-center gap-1 active:scale-95 transition-all">
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : (editingId ? <CheckSquare className="w-5 h-5" /> : <Save className="w-5 h-5" />)}
          <span>{isSaving ? (editingId ? "Updating..." : "Logging...") : (editingId ? "Update Record" : "Commit")}</span>
        </button>
        <button 
          onClick={resetForm} 
          className="px-1 md:px-8 py-4 border-2 border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[9px] md:text-sm rounded-sm flex flex-col md:flex-row items-center justify-center gap-1 active:scale-95 transition-all hover:text-slate-700 hover:border-slate-400"
          title="Clear form for a new vehicle"
        >
          <RotateCcw className="w-5 h-5" /> <span>New Vehicle</span>
        </button>

        {showShareOptions && (
          <div className="absolute bottom-full mb-6 left-4 right-4 md:left-auto md:right-10 bg-slate-950 p-10 rounded-sm shadow-2xl flex flex-col gap-6 min-w-[320px] animate-in slide-in-from-bottom-6">
            <h4 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-4 border-b border-white/10 pb-4">Precision Report Engine</h4>
            <button onClick={printNativePdf} className="flex items-center gap-6 text-white text-[11px] font-black uppercase hover:text-white group transition-all text-left"><Printer className="w-8 h-8 text-white/40 group-hover:scale-110 group-hover:text-white" /> <div><div className="text-white font-black">Print PDF</div><div className="text-white/40 text-[8px]">direct to hardware exact layout</div></div></button>
            <button onClick={downloadPdfReport} className="flex items-center gap-6 text-white text-[11px] font-black uppercase hover:text-primary group transition-all text-left"><Download className="w-8 h-8 text-primary group-hover:scale-110" /> <div><div className="text-white font-black">Save PDF</div><div className="text-white/40 text-[8px]">tiny native pdf archive</div></div></button>
            <button onClick={emailPdfReport} className="flex items-center gap-6 text-white text-[11px] font-black uppercase hover:text-secondary group transition-all text-left"><Mail className="w-8 h-8 text-secondary group-hover:scale-110" /> <div><div className="text-white font-black">Email PDF</div><div className="text-white/40 text-[8px]">native small share</div></div></button>
            <button onClick={shareWordRecord} className="flex items-center gap-6 text-white text-[11px] font-black uppercase hover:text-white/60 group transition-all text-left opacity-60"><FileBox className="w-8 h-8 text-white/40 group-hover:scale-110" /> <div><div className="text-white font-black">Share Word Rec</div><div className="text-white/40 text-[8px]">legacy .docx format</div></div></button>
          </div>
        )}
      </div>

      {showScannerModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="flex justify-between items-center p-6 bg-slate-900 border-b border-white/10 text-white">
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-sm">Scanner Engine</span>
              <span className="text-[10px] opacity-40 uppercase font-black">Auto-detecting...</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleTorch} className={cn("p-4 rounded-sm transition-all", torchOn ? "bg-primary text-white" : "bg-white/10 text-white")}><Zap className="w-6 h-6" /></button>
              <button onClick={() => setShowScannerModal(false)} className="p-4 bg-white/10 rounded-sm"><X className="w-8 h-8" /></button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
             <video ref={videoRef} playsInline autoFocus className="w-full h-full object-cover" />
             <div id={REAL_TIME_SCANNER_ID} className="hidden" />
             <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-40 border-y-4 border-primary/40 pointer-events-none flex items-center justify-center">
                <div className="w-full h-1 bg-primary/80 animate-[pulse_1.5s_infinite] shadow-[0_0_20px_rgba(251,191,36,1)]" />
                <div className="absolute inset-0 border-x-4 border-primary/20" />
             </div>
             <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center gap-4 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-sm border border-white/10 flex items-center gap-3">
                   <div className="w-3 h-3 bg-secondary rounded-sm animate-pulse" />
                   <span className="text-white font-black uppercase text-[10px] tracking-widest">Target Acquisition Active</span>
                </div>
             </div>
          </div>
          {!scannerSupported && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
               <AlertTriangle className="w-20 h-20 text-red-500 mb-6" />
               <h2 className="text-white text-2xl font-black uppercase mb-4">Hardware Blocked</h2>
               <p className="text-white/60 mb-8">Please ensure camera permissions are enabled in your browser settings.</p>
               <button onClick={() => setShowScannerModal(false)} className="bg-primary px-10 py-4 font-black uppercase rounded-sm">Go Back</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
