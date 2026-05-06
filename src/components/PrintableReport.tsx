import React from "react";
import { FormData, CHECKLIST_LEFT, CHECKLIST_RIGHT } from "@/types/inspection";

interface PrintableReportProps {
  formData: FormData;
  id?: string;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ formData, id, innerRef }) => {
  return (
    <div id={id} ref={innerRef} style={{ width: '210mm', height: '296mm', padding: '10mm', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#000000' }} className="text-black leading-tight border shadow-none print:shadow-none relative overflow-hidden flex flex-col">
      <div className="text-center mb-4 border-b-2 border-black pb-2">
        <div className="text-2xl font-black uppercase tracking-tighter">RIGHT PRICE AUTO SALES, INC.</div>
        <div className="text-[10px] font-bold tracking-widest mt-0.5 opacity-80">5223 NW BROAD STREET • MURFREESBORO, TN. 37129</div>
        <div className="text-[10px] font-black mt-0.5">615-893-1727</div>
        <div className="mt-4 text-xl font-black underline decoration-2 uppercase tracking-tight">STOCK-IN INSPECTION LIST</div>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Year</span><span className="flex-1 font-bold text-xs">{formData.year}</span></div>
          <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Make</span><span className="flex-1 font-bold text-xs">{formData.make}</span></div>
          <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Model/Pkg</span><span className="flex-1 font-bold text-xs">{formData.modelPkg}</span></div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
           <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Body</span><span className="flex-1 font-bold text-xs">{formData.body}</span></div>
           <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Miles</span><span className="flex-1 font-bold text-xs">{formData.miles}</span></div>
           <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Color</span><span className="flex-1 font-bold text-xs">{formData.color}</span></div>
        </div>
        
        <div className="flex border-b border-black pb-0.5">
          <span className="font-bold text-[9px] uppercase mr-4">Transmission</span>
          <span className="font-bold text-xs">{formData.autoManual}</span>
        </div>

        <div className="flex items-center gap-4 p-1.5 border border-black/10" style={{ backgroundColor: '#f8fafc' }}>
          <span className="font-black text-[10px] uppercase tracking-widest text-white px-2 py-0.5" style={{ backgroundColor: '#000000' }}>VIN Identification</span>
          <div className="flex-1 text-lg font-black tracking-[0.3em] font-mono text-center" style={{ color: '#000000' }}>{formData.vin || "NOT RECORDED"}</div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Purchased From</span><span className="flex-1 font-bold text-xs">{formData.purchasedFrom}</span></div>
          <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Paid Status</span><span className="flex-1 font-bold text-xs">{formData.paid}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Price</span><span className="flex-1 font-bold text-xs">{formData.price}</span></div>
          <div className="flex border-b border-black pb-0.5"><span className="font-bold text-[9px] uppercase mr-2">Down Payment</span><span className="flex-1 font-bold text-xs">{formData.down}</span></div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-12 items-start flex-1 min-h-0">
        <div className="space-y-1.5 pt-2 border-t border-black/20 h-full flex flex-col">
          <h4 className="text-[9px] font-black uppercase mb-2 text-white inline-block px-2 py-0.5" style={{ backgroundColor: '#000000' }}>Physical Audit</h4>
          <div className="grid grid-cols-1 gap-1">
            {CHECKLIST_LEFT.map(item => (
              <div key={item} className="flex items-center gap-3 text-[10px] font-medium pb-0.5" style={{ borderBottomColor: '#f1f5f9', borderBottomWidth: '1px' }}>
                 <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold">
                  {formData.checklist[item] ? "X" : ""}
                 </div>
                 <span>{item.replace("( ) ", "")}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex-1 flex flex-col min-h-0">
            <div className="font-black text-[9px] uppercase mb-1">Execution Audit Remarks:</div>
            <div className="border border-black p-2 text-[10px] italic leading-relaxed flex-1 overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
              {formData.remarks || "No specific condition notes recorded for this unit."}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-black/20 h-full flex flex-col">
          <h4 className="text-[9px] font-black uppercase mb-2 text-white inline-block px-2 py-0.5" style={{ backgroundColor: '#720009' }}>Fluid Authority</h4>
          <div className="grid grid-cols-1 gap-1">
            {CHECKLIST_RIGHT.map(item => (
              <div key={item} className="flex items-center gap-3 text-[10px] font-medium pb-0.5" style={{ borderBottomColor: '#f1f5f9', borderBottomWidth: '1px' }}>
                 <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold" style={{ color: '#720009' }}>
                  {formData.checklist[item] ? "X" : ""}
                 </div>
                 <span>{item.replace("( ) ", "")}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-auto pt-8">
            <div className="flex justify-between items-end border-t border-black/10 pt-4">
              <div className="text-left w-1/2">
                <div className="text-[7px] font-black uppercase opacity-40">Agent Identity</div>
                <div className="text-[9px] font-bold border-b border-black min-w-[80px] h-5 mb-0.5">{formData.signature}</div>
                <div className="text-[6px] uppercase tracking-tighter italic font-bold">Authorized Inspector Signature</div>
              </div>
              <div className="text-right">
                <div className="text-[7px] font-black uppercase opacity-40">Audit Date</div>
                <div className="text-[9px] font-bold">{formData.date}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-[7px] font-bold uppercase tracking-[0.5em] opacity-20 border-t border-black/10 pt-2 shrink-0">
        Official Internal Record • Right Price Auto Sales Intelligence System v4.0.0
      </div>
    </div>
  );
};
