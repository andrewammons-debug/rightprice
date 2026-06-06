import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CreditApplicationFormV2 from "../credit/CreditFormV2";

const CreditPortalTest = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans selection:bg-secondary selection:text-white print:bg-white print:min-h-0 print:text-black">
      {/* Industrial Navigation Header */}
      <nav className="bg-slate-900 fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-4 border-b border-white/5 shadow-2xl no-print">
        <Link 
          href="/"
          className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Suite</span>
        </Link>
        <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic">Right Price Credit App V2 (Test)</div>
        <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg">RA</div>
      </nav>

      <main className="pt-24 pb-36 px-4 md:px-10 w-full max-w-7xl mx-auto print:pt-0 print:pb-0 print:px-0 print:max-w-none">
        {/* The Parallel Application Form */}
        <div className="relative mt-10 z-10 print:mt-0 print:z-auto">
          <div className="absolute top-4 left-4 right-4 bottom-[-16px] bg-white opacity-10 rounded-sm shadow-sm -z-10 no-print" />
          <CreditApplicationFormV2 />
        </div>
      </main>
    </div>
  );
};

export default CreditPortalTest;
