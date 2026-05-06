import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

const borderNone = { style: BorderStyle.NONE, size: 0, color: "auto" };

interface InspectionData {
  year: string;
  make: string;
  modelPkg: string;
  body: string;
  miles: string;
  color: string;
  autoManual: string;
  vin: string;
  purchasedFrom: string;
  paid: string;
  price: string;
  down: string;
  remarks: string;
  signature: string;
  date: string;
  checklist: Record<string, boolean>;
}

export async function generateWordDoc(data: InspectionData) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        // Header
        new Paragraph({
          children: [new TextRun({ text: "RIGHT PRICE AUTO SALES, INC.", bold: true, size: 28 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "5223 NW BROAD STREET", size: 24 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "MURFREESBORO, TN. 37129", size: 24 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "615-893-1727", size: 24 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "STOCK-IN INSPECTION LIST", bold: true, underline: {}, size: 28 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
        }),

        // Top Fields Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone, insideHorizontal: borderNone, insideVertical: borderNone },
          rows: [
            new TableRow({
              children: [
                createFieldCell("YEAR", data.year, 25),
                createFieldCell("MAKE", data.make, 35),
                createFieldCell("MODEL/PKG", data.modelPkg, 40),
              ],
            }),
            new TableRow({
              children: [
                createFieldCell("BODY", data.body, 35),
                createFieldCell("MILES", data.miles, 30),
                createFieldCell("COLOR", data.color, 35),
              ],
            }),
            new TableRow({
              children: [
                createFieldCell("AUTO/MANUAL", data.autoManual, 100),
              ],
            }),
          ],
        }),

        // VIN Row
        new Paragraph({
          children: [
            new TextRun({ text: "VIN ", bold: true }),
            new TextRun({ text: (data.vin || "").padEnd(17, "_").split("").join(" "), bold: true, size: 24 }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // Purchase Info Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone, insideHorizontal: borderNone, insideVertical: borderNone },
          rows: [
            new TableRow({
              children: [
                createFieldCell("PURCHASED FROM", data.purchasedFrom, 70),
                createFieldCell("PAID", data.paid, 30),
              ],
            }),
            new TableRow({
              children: [
                createFieldCell("PRICE", data.price, 50),
                createFieldCell("DOWN", data.down, 50),
              ],
            }),
          ],
        }),

        // Checklists Row
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone, insideHorizontal: borderNone, insideVertical: borderNone },
          rows: [
            new TableRow({
              children: [
                // Left Column
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    ...Object.keys(data.checklist).filter(k => !isFluidCheck(k)).map(item => 
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.checklist[item] ? "[X] " : getCheckType(item), size: 18 }),
                          new TextRun({ text: item.replace("( ) ", ""), size: 18 }),
                        ],
                        spacing: { after: 40 },
                      })
                    ),
                    new Paragraph({ children: [new TextRun({ text: "REMARKS:", bold: true })], spacing: { before: 200 } }),
                    new Paragraph({ children: [new TextRun({ text: data.remarks || "__________________________________________________", italics: true, size: 18 })] }),
                    new Paragraph({ children: [new TextRun({ text: "__________________________________________________", size: 18 })] }),
                    new Paragraph({ children: [new TextRun({ text: "__________________________________________________", size: 18 })] }),
                  ],
                }),
                // Right Column
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Fluid Checks", bold: true, underline: {} })], spacing: { after: 100 } }),
                    ...Object.keys(data.checklist).filter(k => isFluidCheck(k)).map(item => 
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.checklist[item] ? "[X] " : getCheckType(item), size: 18 }),
                          new TextRun({ text: item.replace("( ) ", ""), size: 18 }),
                        ],
                        spacing: { after: 40 },
                      })
                    ),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "SIGNATURE ", bold: true }),
                        new TextRun({ text: data.signature || "_________________________", size: 22, italics: true }),
                      ],
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 800 },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Inspection_${data.vin || "Record"}.docx`);
  return blob;
}

function createFieldCell(label: string, value: string, widthPercent: number) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${label} `, bold: true, size: 20 }),
          new TextRun({ text: value || "___________________", size: 20 }),
        ],
        spacing: { after: 100 },
      }),
    ],
  });
}

function isFluidCheck(item: string) {
  const fluids = ["Oil", "Water", "Transmission Fluid", "Brake Fluid", "Power steering Fluid", "Leaks", "Must have 1/4 tank of GAS", "Anti-Freeze Must Be -10", "( ) Seat Belt", "( ) Spare Key & Works"];
  return fluids.includes(item);
}

function getCheckType(item: string) {
  return item.includes("( )") ? "( ) " : "[ ] ";
}
