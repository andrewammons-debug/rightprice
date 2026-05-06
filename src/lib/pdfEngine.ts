import { PDFDocument } from 'pdf-lib';
import { FormData, CHECKLIST_LEFT, CHECKLIST_RIGHT } from "@/types/inspection";

/**
 * Generates a high-precision vector PDF by filling the AcroForm fields
 * in the user-provided inspect_ion.pdf template.
 */
export const generateNativePdf = async (formData: FormData): Promise<Blob> => {
  try {
    // 1. Load the template from the public directory
    const existingPdfBytes = await fetch('/inspect_ion.pdf').then(res => {
      if (!res.ok) throw new Error("Template inspect_ion.pdf not found in public folder");
      return res.arrayBuffer();
    });
    
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    // 2. Map Core Header Fields (Text4 - Text17)
    // We use try-catch for each field to ensure one missing field doesn't crash the engine
    const setSafeText = (name: string, text: string) => {
      try { form.getTextField(name).setText(text || ""); } catch (e) {}
    };

    setSafeText('Text4', formData.year);
    setSafeText('Text5', formData.make);
    setSafeText('Text6', formData.modelPkg);
    setSafeText('Text7', formData.body);
    setSafeText('Text9', formData.miles);
    setSafeText('Text10', formData.color);
    setSafeText('Text11', formData.autoManual);
    setSafeText('Text13', formData.vin?.toUpperCase());
    setSafeText('Text14', formData.purchasedFrom);
    setSafeText('Text15', formData.paid);
    setSafeText('Text16', formData.price);
    setSafeText('Text17', formData.down);

    // 3. Map Checklist Left (Buttons 18-33)
    CHECKLIST_LEFT.forEach((item, index) => {
      const buttonName = `Button${18 + index}`;
      if (formData.checklist[item]) {
        try { 
          const cb = form.getCheckBox(buttonName);
          cb.check(); 
        } catch (e) {}
      }
    });

    // 4. Map Checklist Right (Buttons 34-44, skipping 39 per detected IDs)
    const rightButtons = [34, 35, 36, 37, 38, 40, 41, 42, 43, 44];
    CHECKLIST_RIGHT.forEach((item, index) => {
      const buttonName = `Button${rightButtons[index]}`;
      if (formData.checklist[item]) {
        try { 
          const cb = form.getCheckBox(buttonName);
          cb.check(); 
        } catch (e) {}
      }
    });

    // 5. Map Footer (Remarks & Signature)
    // If remarks are long, we split them across the two remarks lines provided
    const remarks = formData.remarks || "";
    if (remarks.length > 60) {
       setSafeText('Text45', remarks.substring(0, 60));
       setSafeText('Text46', remarks.substring(60));
    } else {
       setSafeText('Text45', remarks);
    }
    
    setSafeText('Text47', formData.signature);

    // 6. Finalize and Flatten
    // Flattening ensures the fields are no longer editable and the text is part of the document
    form.flatten();

    const pdfBytes = await pdfDoc.save();
    // Use any cast to bypass strict ArrayBuffer check in current TS environment
    return new Blob([pdfBytes as any], { type: 'application/pdf' });

  } catch (error) {
    console.error("PDF Engine Error:", error);
    throw error;
  }
};
