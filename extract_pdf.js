const fs = require('fs');
const PDFParser = require('pdf2json');

let pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
  const texts = pdfData.formImage.Pages[0].Texts;
  const mapped = texts.map(t => {
     let str = decodeURIComponent(t.R[0].T);
     return { text: str, x: t.x, y: t.y };
  });
  
  fs.writeFileSync('pdf_coords.json', JSON.stringify(mapped, null, 2));
  console.log("Extracted " + mapped.length + " text elements.");
});

pdfParser.loadPDF("pics/inspection_.pdf");
