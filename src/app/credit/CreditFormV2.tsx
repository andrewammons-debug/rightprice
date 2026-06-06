"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creditApplicationSchema } from "@/lib/creditSchemas";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Printer, Mail, Download, Share2, Loader2, FileCheck } from "lucide-react";

// HIGH-PERFORMANCE DIRECT DOM SHRUNK INPUTS FOR ZERO OVERFLOW
const UnderlineInput = ({ label, error, className = "", register, name, ...props }: any) => {
    const registeredProps = register ? register(name) : {};
    const inputRef = useRef<HTMLInputElement | null>(null);

    const adjustFontSize = (el: HTMLInputElement) => {
        const len = el.value.length;
        let fontSize = "12px";
        
        if (name === "state") {
            if (len > 8) fontSize = "7px";
            else if (len > 5) fontSize = "8.5px";
            else if (len > 2) fontSize = "10px";
        } else if (name === "zip") {
            if (len > 10) fontSize = "7px";
            else if (len > 8) fontSize = "8.5px";
            else if (len > 5) fontSize = "10px";
        } else if (name === "dob" || name === "phone" || name === "ssn" || name === "dl") {
            if (len > 14) fontSize = "7.5px";
            else if (len > 11) fontSize = "8.5px";
            else if (len > 8) fontSize = "10px";
        } else {
            if (len > 45) fontSize = "7.5px";
            else if (len > 35) fontSize = "8.5px";
            else if (len > 22) fontSize = "10px";
        }
        
        el.style.fontSize = fontSize;
    };

    // Auto-shrink on mount (for default / pre-populated values)
    useEffect(() => {
        if (inputRef.current) {
            adjustFontSize(inputRef.current);
        }
    }, [name]);

    const handleOnInput = (e: React.FormEvent<HTMLInputElement>) => {
        adjustFontSize(e.currentTarget);
    };

    return (
        <div className={cn("flex flex-col min-w-0", className)}>
            <div className="flex items-end gap-1.5 min-w-0">
                {label && (
                    <Label 
                        htmlFor={name}
                        className="text-[9px] font-bold uppercase text-slate-900 leading-tight mb-0.5 whitespace-nowrap cursor-pointer hover:text-[#10b77f] transition-colors"
                    >
                        {label}
                    </Label>
                )}
                <input
                    id={name}
                    className={cn(
                        "flex-1 min-w-0 border-b bg-transparent py-0.5 px-0.5 text-slate-900 font-semibold focus:outline-none transition-colors",
                        error ? "border-red-500 focus:border-red-600" : "border-slate-300 focus:border-[#10b77f]"
                    )}
                    {...registeredProps}
                    ref={(el) => {
                        if (registeredProps.ref) registeredProps.ref(el);
                        inputRef.current = el;
                    }}
                    onInput={handleOnInput}
                    {...props}
                />
            </div>
            {error && <span className="text-[7px] text-red-500 font-medium leading-none">{error.message}</span>}
        </div>
    );
};

const TableShrinkInput = ({ className = "", register, name, ...props }: any) => {
    const registeredProps = register ? register(name) : {};
    const inputRef = useRef<HTMLInputElement | null>(null);

    const adjustFontSize = (el: HTMLInputElement) => {
        const len = el.value.length;
        let fontSize = "12px";
        if (len > 38) {
            fontSize = "7px";
        } else if (len > 28) {
            fontSize = "8.5px";
        } else if (len > 18) {
            fontSize = "10px";
        }
        el.style.fontSize = fontSize;
    };

    // Auto-shrink on mount (for default / pre-populated values)
    useEffect(() => {
        if (inputRef.current) {
            adjustFontSize(inputRef.current);
        }
    }, [name]);

    const handleOnInput = (e: React.FormEvent<HTMLInputElement>) => {
        adjustFontSize(e.currentTarget);
    };

    return (
        <input
            id={name}
            className={cn(
                "w-full px-2 py-0.5 bg-transparent text-slate-900 font-semibold focus:outline-none placeholder-slate-300 print:text-black",
                className
            )}
            {...registeredProps}
            ref={(el) => {
                if (registeredProps.ref) registeredProps.ref(el);
                inputRef.current = el;
            }}
            onInput={handleOnInput}
            {...props}
        />
    );
};


const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-900 mb-1 mt-3 print:mt-2.5 print:mb-0.5 border-l-4 border-primary pl-2 leading-none">
        {children}
    </h3>
);

const CreditApplicationFormV2 = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const captureRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        getValues,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(creditApplicationSchema),
        defaultValues: {
            name: "", dob: "", phone: "", streetAddress: "", ssn: "", dl: "", city: "", state: "", zip: "",
            dependents: "", homeStatus: undefined, monthlyHomeCost: "", toWhom: "", previousAddress: "",
            howLongYrs: "", howLongMos: "", employer: "", employerPhone: "", occupation: "",
            netCompensation: "", formerEmployer: "", formerHowLongYrs: "", formerHowLongMos: "",
            formerEmployerAddress: "", otherIncomeAmount: "", otherIncomeSource: "",
            spouseLiable: undefined, maritalStatus: undefined, spouseName: "", spouseAge: "",
            spouseAddress: "", spouseEmployed: undefined, spouseByWhom: "", spouseHowLongYrs: "",
            spouseHowLongMos: "", spouseEmployerAddress: "", spouseMonthlySalary: "", spousePhone: "",
            spousePosition: "", spouseSsn: "", relativeName: "", relativeAddress: "",
            lastCarDealer: "", financedBy: "", bankName: "", bankChecking: false,
            bankSavings: false, bankLoan: false, bankAddress: "",
            authDate: "",
            reference1Name: "", reference1Address: "", reference1Phone: "",
            reference2Name: "", reference2Address: "", reference2Phone: "",
            reference3Name: "", reference3Address: "", reference3Phone: "",
            reference4Name: "", reference4Address: "", reference4Phone: "",
        }
    });

    const downloadPdfReport = async () => {
        if (!captureRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(captureRef.current, { 
                scale: 2, 
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1200,
                onclone: (clonedDoc) => {
                    const styleSheets = Array.from(clonedDoc.styleSheets);
                    styleSheets.forEach(sheet => {
                        try {
                            const rules = Array.from(sheet.cssRules);
                            for (let i = rules.length - 1; i >= 0; i--) {
                                sheet.deleteRule(i);
                            }
                        } catch (e) {
                            if (sheet.ownerNode instanceof HTMLElement) sheet.ownerNode.remove();
                        }
                    });

                    clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());

                    clonedDoc.querySelectorAll('*').forEach((el: any) => {
                        el.removeAttribute('class');
                        el.removeAttribute('style');
                    });

                    const immortalStyle = clonedDoc.createElement('style');
                    immortalStyle.innerHTML = `
                        .paper-form {
                            background-color: #ffffff !important;
                            color: #000000 !important;
                            font-family: Arial, sans-serif !important;
                            padding: 15mm !important;
                            display: block !important;
                        }
                        .paper-form * {
                            color: #000000 !important;
                            border-color: #000000 !important;
                            background-color: transparent !important;
                            font-size: 10px !important;
                        }
                        .no-print { display: none !important; }
                    `;
                    clonedDoc.head.appendChild(immortalStyle);

                    const el = clonedDoc.querySelector('.paper-form') as HTMLElement;
                    if (el) {
                        el.style.width = '210mm';
                        el.style.height = '297mm';
                        el.style.margin = '0';
                        el.style.padding = '15mm';
                        el.classList.add('hide-buttons-for-pdf');
                    }
                }
            });
            const imgData = canvas.toDataURL("image/png", 1.0);
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(`Credit_App_${watch("name") || "Record"}.pdf`);
        } catch (e) {
            console.error("PDF Generate Error:", e);
            alert("Error generating PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    const shareApplication = async () => {
        if (!captureRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(captureRef.current, { scale: 1.5, useCORS: true });
            const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
            const file = new File([blob], `Credit_App_${watch("name") || "Record"}.png`, { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Credit Application: ${watch("name")}`,
                    text: "Authorized Credit Application submission for Right Price Auto Sales."
                });
            } else {
                alert("Sharing not supported. Please use Download PDF instead.");
            }
        } catch (err) {
            console.error("Share failed", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div 
            ref={captureRef}
            className="w-full max-w-5xl mx-auto bg-white shadow-[0_10px_50px_-12px_rgba(0,0,0,0.1)] rounded-sm p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-1000 paper-form print:border-0 print:shadow-none min-h-screen overflow-hidden"
        >
            <style jsx global>{`
                @media print {
                    @page { 
                        size: letter; 
                        margin: 0.5in !important; 
                    }
                    body { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        background: #ffffff !important; 
                    }
                    .no-print { 
                        display: none !important; 
                    }
                    .paper-form { 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        height: 100% !important;
                        min-height: 100% !important;
                        padding: 4mm 6mm !important; /* Balanced print inner spacing */
                        margin: 0 auto !important;
                        box-shadow: none !important;
                        border: none !important;
                        transform: none !important;
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                    }
                }
                .hide-buttons-for-pdf .no-print {
                    display: none !important;
                }
                .hide-buttons-for-pdf {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }
                /* Hard override for html2canvas modern color crash */
                .paper-form * {
                    background-color: transparent;
                }
                .paper-form .bg-slate-50, .paper-form .bg-slate-100 {
                    background-color: #f8fafc !important;
                }
            `}</style>
            
            <div className="text-center mb-4 print:mb-3">
                <h1 className="text-xl font-black uppercase tracking-[0.2em] text-slate-900 relative inline-block pb-1 print:text-lg">
                    Credit Application
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900" />
                    <div className="absolute bottom-[-3px] left-0 w-full h-[1px] bg-slate-900" />
                </h1>
            </div>

            <form className="space-y-3.5 print:space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                    <SectionHeader>Personal Information</SectionHeader>
                    <div className="grid grid-cols-12 gap-x-4 gap-y-2 print:gap-y-1.5 overflow-hidden">
                        <UnderlineInput label="Name" className="col-span-6" register={register} name="name" error={errors.name} />
                        <UnderlineInput label="Date of Birth" className="col-span-3" register={register} name="dob" error={errors.dob} />
                        <UnderlineInput label="Phone #" className="col-span-3" register={register} name="phone" error={errors.phone} />

                        <UnderlineInput label="Street Address" className="col-span-6" register={register} name="streetAddress" error={errors.streetAddress} />
                        <UnderlineInput label="SSN" className="col-span-3" register={register} name="ssn" error={errors.ssn} />
                        <UnderlineInput label="DL#" className="col-span-3" register={register} name="dl" error={errors.dl} />

                        <UnderlineInput label="City" className="col-span-4" register={register} name="city" error={errors.city} />
                        <UnderlineInput label="State" className="col-span-2" register={register} name="state" error={errors.state} />
                        <UnderlineInput label="Zip" className="col-span-2" register={register} name="zip" error={errors.zip} />
                        <UnderlineInput label="# of Dependents" className="col-span-4" register={register} name="dependents" />
                    </div>
                </div>

                <div>
                    <SectionHeader>Residential Status</SectionHeader>
                    <div className="flex items-center gap-6 py-2 px-3 print:py-1 print:px-2 print:bg-transparent print:border-none rounded-lg border border-slate-100/50" style={{ backgroundColor: '#f8fafc' }}>
                        <div className="flex items-center gap-3">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Home</Label>
                            <div className="flex items-center gap-2">
                                <Checkbox id="rent" onCheckedChange={(checked) => checked && setValue("homeStatus", "rent")} checked={watch("homeStatus") === "rent"} />
                                <label htmlFor="rent" className="text-[10px] font-bold uppercase text-slate-900 cursor-pointer">Rent</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="own" onCheckedChange={(checked) => checked && setValue("homeStatus", "own")} checked={watch("homeStatus") === "own"} />
                                <label htmlFor="own" className="text-[10px] font-bold uppercase text-slate-900 cursor-pointer">Own</label>
                            </div>
                        </div>
                        <UnderlineInput label="Monthly $" className="w-32" register={register} name="monthlyHomeCost" />
                        <UnderlineInput label="To Whom?" className="flex-1" register={register} name="toWhom" />
                    </div>
                </div>

                <div>
                    <SectionHeader>Employment Information</SectionHeader>
                    <div className="grid grid-cols-12 gap-x-4 gap-y-2 print:gap-y-1.5 overflow-hidden">
                        <UnderlineInput label="Previous Address" className="col-span-7" register={register} name="previousAddress" />
                        <div className="col-span-5 flex gap-3">
                            <Label className="text-[10px] font-bold uppercase text-slate-500 self-end">How Long</Label>
                            <UnderlineInput label="Yrs" className="w-12" register={register} name="howLongYrs" />
                            <UnderlineInput label="Mos" className="w-12" register={register} name="howLongMos" />
                        </div>

                        <UnderlineInput label="Employer" className="col-span-7" register={register} name="employer" error={errors.employer} />
                        <UnderlineInput label="Phone #" className="col-span-5" register={register} name="employerPhone" />

                        <UnderlineInput label="Occupation" className="col-span-7" register={register} name="occupation" error={errors.occupation} />
                        <UnderlineInput label="Net Comp $" className="col-span-5" register={register} name="netCompensation" error={errors.netCompensation} />
                    </div>

                    <div className="grid grid-cols-12 gap-x-6 gap-y-2 mt-2 print:mt-1.5">
                        <UnderlineInput label="Former Employer" className="col-span-7" register={register} name="formerEmployer" />
                        <div className="col-span-5 flex gap-3">
                            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 self-end">How Long</Label>
                            <UnderlineInput label="Yrs" className="w-12" register={register} name="formerHowLongYrs" />
                            <UnderlineInput label="Mos" className="w-12" register={register} name="formerHowLongMos" />
                        </div>
                        <UnderlineInput label="Address" className="col-span-12" register={register} name="formerEmployerAddress" />
                    </div>
                </div>

                <div>
                    <SectionHeader>Nearest Relative (Not living with you)</SectionHeader>
                    <div className="grid grid-cols-12 gap-x-4 gap-y-2 print:gap-y-1.5 overflow-hidden">
                        <UnderlineInput label="Name" className="col-span-6" register={register} name="relativeName" error={errors.relativeName} />
                        <UnderlineInput label="Address" className="col-span-6" register={register} name="relativeAddress" error={errors.relativeAddress} />
                    </div>
                </div>

                <div className="mt-1 p-1.5 print:py-1 print:bg-transparent border border-slate-200 print:border-black rounded relative overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                    <div className="absolute top-0 left-0 w-1 h-full print:hidden" style={{ backgroundColor: '#cbd5e1' }} />
                    <p className="text-[8px] leading-tight text-slate-600 font-semibold italic text-center px-4 print:text-black">
                        Note: You are not required to list income from alimony, child support, or separate maintenance payments UNLESS you wish to rely on such income. However, if any of the additional income shown is from such source, what is the amount?
                    </p>
                </div>

                <div>
                    <div className="grid grid-cols-12 gap-6 py-1.5 px-3 print:py-1 print:px-2 print:bg-transparent rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                        <UnderlineInput label="Other Income $" className="col-span-4" register={register} name="otherIncomeAmount" />
                        <UnderlineInput label="(Monthly) Source" className="col-span-8" register={register} name="otherIncomeSource" />
                    </div>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-slate-200 print:border-black">
                    <div className="flex items-center justify-between gap-4 p-1.5 print:py-1 print:px-2 print:bg-transparent rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                        <Label className="text-[9px] font-black uppercase text-slate-900 leading-tight">
                            Will your present or former spouse, if any, be contractually liable for this debt?
                        </Label>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox id="spouseYes" onCheckedChange={(checked) => setValue("spouseLiable", !!checked)} checked={watch("spouseLiable") === true} />
                                <label htmlFor="spouseYes" className="text-[10px] font-bold uppercase cursor-pointer">Yes</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="spouseNo" onCheckedChange={(checked) => setValue("spouseLiable", !checked)} checked={watch("spouseLiable") === false} />
                                <label htmlFor="spouseNo" className="text-[10px] font-bold uppercase cursor-pointer">No</label>
                            </div>
                        </div>
                    </div>

                    <p className="text-[8px] uppercase text-slate-400 font-semibold italic print:text-[7.5px] print:text-black">
                        If yes, are you married [ ] unmarried [ ] separated [ ] ? If yes, or if you are relying, for repayment, on alimony, child support, or maintenance payments, answer the following questions about your (present or former) spouse:
                    </p>

                    <div className="grid grid-cols-12 gap-x-4 gap-y-2 print:gap-y-1.5 overflow-hidden">
                        <div className="col-span-12 flex items-center gap-4 py-1 print:py-0.5">
                            <div className="flex items-center gap-2">
                                <Checkbox id="married" onCheckedChange={(checked) => checked && setValue("maritalStatus", "married")} checked={watch("maritalStatus") === "married"} />
                                <label htmlFor="married" className="text-[10px] font-bold uppercase text-slate-900 cursor-pointer">Married</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="unmarried" onCheckedChange={(checked) => checked && setValue("maritalStatus", "unmarried")} checked={watch("maritalStatus") === "unmarried"} />
                                <label htmlFor="unmarried" className="text-[10px] font-bold uppercase text-slate-900 cursor-pointer">Unmarried</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="separated" onCheckedChange={(checked) => checked && setValue("maritalStatus", "separated")} checked={watch("maritalStatus") === "separated"} />
                                <label htmlFor="separated" className="text-[10px] font-bold uppercase text-slate-900 cursor-pointer">Separated</label>
                            </div>
                        </div>

                        <UnderlineInput label="Name" className="col-span-6" register={register} name="spouseName" />
                        <UnderlineInput label="Age" className="col-span-2" register={register} name="spouseAge" />
                        <UnderlineInput label="Address" className="col-span-4" register={register} name="spouseAddress" />

                        <div className="col-span-12 flex items-center gap-6 py-1 print:py-0.5">
                            <div className="flex items-center gap-3">
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Employed?</Label>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="spouseEmployedYes" onCheckedChange={(checked) => setValue("spouseEmployed", !!checked)} checked={watch("spouseEmployed") === true} />
                                    <label htmlFor="spouseEmployedYes" className="text-[10px] font-bold uppercase cursor-pointer">Yes</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="spouseEmployedNo" onCheckedChange={(checked) => setValue("spouseEmployed", !checked)} checked={watch("spouseEmployed") === false} />
                                    <label htmlFor="spouseEmployedNo" className="text-[10px] font-bold uppercase cursor-pointer">No</label>
                                </div>
                            </div>
                            <UnderlineInput label="By Whom?" className="flex-1" register={register} name="spouseByWhom" />
                            <div className="flex gap-3">
                                <UnderlineInput label="Yrs" className="w-12" register={register} name="spouseHowLongYrs" />
                                <UnderlineInput label="Mos" className="w-12" register={register} name="spouseHowLongMos" />
                            </div>
                        </div>

                        <UnderlineInput label="Emp. Address" className="col-span-5" register={register} name="spouseEmployerAddress" />
                        <UnderlineInput label="Monthly Salary $" className="col-span-3" register={register} name="spouseMonthlySalary" />
                        <UnderlineInput label="Phone" className="col-span-4" register={register} name="spousePhone" />

                        <UnderlineInput label="Position" className="col-span-6" register={register} name="spousePosition" />
                        <UnderlineInput label="SSN (Optional)" className="col-span-6" register={register} name="spouseSsn" />
                    </div>
                </div>

                <div>
                    <SectionHeader>Credit and Trade Reference</SectionHeader>
                    <div className="grid grid-cols-12 gap-x-4 gap-y-2 print:gap-y-1.5 overflow-hidden">
                        <UnderlineInput label="Your Bank" className="col-span-6" register={register} name="bankName" />
                        <div className="col-span-6 flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Checkbox id="checking" onCheckedChange={(checked) => setValue("bankChecking", !!checked)} checked={watch("bankChecking")} />
                                <label htmlFor="checking" className="text-[10px] font-bold cursor-pointer">Checking</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="savings" onCheckedChange={(checked) => setValue("bankSavings", !!checked)} checked={watch("bankSavings")} />
                                <label htmlFor="savings" className="text-[10px] font-bold cursor-pointer">Savings</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="loan" onCheckedChange={(checked) => setValue("bankLoan", !!checked)} checked={watch("bankLoan")} />
                                <label htmlFor="loan" className="text-[10px] font-bold cursor-pointer">Loan</label>
                            </div>
                        </div>
                        <UnderlineInput label="Address" className="col-span-12" register={register} name="bankAddress" />
                    </div>

                    <div className="grid grid-cols-12 gap-x-6 gap-y-2 mt-2 print:mt-1.5">
                        <UnderlineInput label="Last Car Purchased From: Dealer" className="col-span-7" register={register} name="lastCarDealer" />
                        <UnderlineInput label="Financed By" className="col-span-5" register={register} name="financedBy" />
                    </div>
                </div>

                <div>
                    <SectionHeader>References</SectionHeader>
                    <div className="border-2 border-slate-400 print:border-black rounded-sm overflow-hidden mt-1">
                        <Table>
                            <TableHeader className="bg-slate-100 border-b-2 border-slate-400 print:border-black">
                                <TableRow className="hover:bg-transparent h-6">
                                    <TableHead className="text-[8.5px] uppercase font-black text-slate-800 h-6 px-2 border-r border-slate-300 print:border-black print:text-black">Name</TableHead>
                                    <TableHead className="text-[8.5px] uppercase font-black text-slate-800 h-6 px-2 border-r border-slate-300 print:border-black print:text-black">Address</TableHead>
                                    <TableHead className="text-[8.5px] uppercase font-black text-slate-800 h-6 px-2 print:text-black">#</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[1, 2, 3, 4].map((i) => (
                                    <TableRow key={i} className={cn("hover:bg-transparent h-6", i < 4 ? "border-b border-slate-300 print:border-black" : "")}>
                                        <TableCell className="p-0 border-r border-slate-300 print:border-black">
                                            <TableShrinkInput name={`reference${i}Name`} placeholder="Full Name" register={register} />
                                        </TableCell>
                                        <TableCell className="p-0 border-r border-slate-300 print:border-black">
                                            <TableShrinkInput name={`reference${i}Address`} placeholder="Full Address" register={register} />
                                        </TableCell>
                                        <TableCell className="p-0">
                                            <TableShrinkInput name={`reference${i}Phone`} placeholder="Phone Number" register={register} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 print:border-black">
                    <p className="text-[7.5px] font-semibold leading-tight text-slate-500 mb-2 print:text-[7.5px] print:text-black">
                        I AUTHORIZE the making of whatever credit inquiries are deemed necessary in connection with my credit application or in the course of review or collection of any credit extended in reliance on the application. I authorize and instruct any person or consumer reporting agency to compile and furnish any information it may have or obtain in response to such credit inquiries and agree that same shall remain your property whether or not credit is extended.
                        <br />
                        <strong>I have read the foregoing application and the statements made in it are true and correct.</strong>
                    </p>

                    <div className="grid grid-cols-12 gap-x-12 mt-1.5 print:mt-1">
                        <UnderlineInput label="Date" className="col-span-4" register={register} name="authDate" error={errors.authDate} type="date" />
                        <div className="col-span-8 flex flex-col gap-1">
                            <div className="flex items-end gap-2">
                                <span className="text-base font-bold italic text-slate-300 print:text-black">X</span>
                                <div className="flex-1 border-b border-slate-300 print:border-black h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 no-print">
                    <button 
                        type="button"
                        onClick={shareApplication}
                        disabled={isGenerating}
                        className="px-10 py-3 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Email Application
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={downloadPdfReport}
                        disabled={isGenerating}
                        className="px-10 py-3 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded hover:bg-[#720009] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download PDF
                    </button>

                    <button 
                        type="button" 
                        onClick={() => window.print()}
                        className="px-6 py-3 border-2 border-slate-200 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded hover:bg-slate-50 transition-all active:scale-95 hidden sm:flex items-center gap-2"
                    >
                        <Printer className="w-3 h-3" />
                        Print
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreditApplicationFormV2;
