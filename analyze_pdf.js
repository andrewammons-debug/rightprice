const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function analyzePdf() {
  const pdfBytes = fs.readFileSync('pics/inspection_.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  console.log('--- Form Fields ---');
  fields.forEach(field => {
    const type = field.constructor.name;
    const name = field.getName();
    console.log(`${type}: ${name}`);
  });

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  console.log(`\nPage Size: ${width} x ${height}`);
}

analyzePdf().catch(console.error);
