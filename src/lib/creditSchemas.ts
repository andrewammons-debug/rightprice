import { z } from "zod";

export const creditApplicationSchema = z.object({
    // PERSONAL INFORMATION
    name: z.string().min(2, "Name is required"),
    dob: z.string().min(1, "Date of Birth is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    streetAddress: z.string().min(5, "Street address is required"),
    ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, "Invalid SSN format (XXX-XX-XXXX)"),
    dl: z.string().min(1, "Driver's License # is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().length(2, "State must be 2 characters"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid Zip code"),
    dependents: z.string().optional(),

    // HOME STATUS
    homeStatus: z.enum(["rent", "own"]).optional(),
    monthlyHomeCost: z.string().optional(),
    toWhom: z.string().optional(),
    previousAddress: z.string().optional(),
    howLongYrs: z.string().optional(),
    howLongMos: z.string().optional(),

    // CURRENT EMPLOYMENT
    employer: z.string().min(2, "Employer is required"),
    employerPhone: z.string().optional(),
    occupation: z.string().min(2, "Occupation is required"),
    netCompensation: z.string().min(1, "Net compensation is required"),

    // FORMER EMPLOYMENT
    formerEmployer: z.string().optional(),
    formerHowLongYrs: z.string().optional(),
    formerHowLongMos: z.string().optional(),
    formerEmployerAddress: z.string().optional(),

    // OTHER INCOME
    otherIncomeAmount: z.string().optional(),
    otherIncomeSource: z.string().optional(),

    // SPOUSE / CO-APPLICANT
    spouseLiable: z.boolean().optional(),
    maritalStatus: z.enum(["married", "unmarried", "separated"]).optional(),
    spouseName: z.string().optional(),
    spouseAge: z.string().optional(),
    spouseAddress: z.string().optional(),
    spouseEmployed: z.boolean().optional(),
    spouseByWhom: z.string().optional(),
    spouseHowLongYrs: z.string().optional(),
    spouseHowLongMos: z.string().optional(),
    spouseEmployerAddress: z.string().optional(),
    spouseMonthlySalary: z.string().optional(),
    spousePhone: z.string().optional(),
    spousePosition: z.string().optional(),
    spouseSsn: z.string().optional(),

    // NEAREST RELATIVE
    relativeName: z.string().min(2, "Relative name is required"),
    relativeAddress: z.string().min(5, "Relative address is required"),

    // AUTO HISTORY
    lastCarDealer: z.string().optional(),
    financedBy: z.string().optional(),

    // BANKING
    bankName: z.string().optional(),
    bankChecking: z.boolean().optional(),
    bankSavings: z.boolean().optional(),
    bankLoan: z.boolean().optional(),
    bankAddress: z.string().optional(),

    // REFERENCES
    reference1Name: z.string().optional(),
    reference1Address: z.string().optional(),
    reference1Phone: z.string().optional(),
    reference2Name: z.string().optional(),
    reference2Address: z.string().optional(),
    reference2Phone: z.string().optional(),
    reference3Name: z.string().optional(),
    reference3Address: z.string().optional(),
    reference3Phone: z.string().optional(),
    reference4Name: z.string().optional(),
    reference4Address: z.string().optional(),
    reference4Phone: z.string().optional(),

    // AUTHORIZATION
    authDate: z.string().min(1, "Date is required"),
});

export type CreditApplication = z.infer<typeof creditApplicationSchema>;
