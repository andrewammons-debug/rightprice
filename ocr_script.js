const fs = require('fs');
const { createWorker } = require('tesseract.js');

async function doOCR() {
  const worker = await createWorker('eng');
  
  const { data } = await worker.recognize('public/inspection_template.jpg');
  
  const targetWords = ["Year", "Make", "Model", "Body", "Miles", "Color", "Transmission", "VIN", "Purchased", "Paid", "Price", "Down", "Execution", "Fluid", "Agent", "Signature", "Date"];
  
  const results = [];
  data.lines.forEach(line => {
    line.words.forEach(word => {
      const w = word.text.replace(/[^a-zA-Z]/g, '');
      if (targetWords.some(tw => tw.toLowerCase() === w.toLowerCase())) {
        results.push({
          word: w,
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1
        });
      }
    });
  });
  
  fs.writeFileSync('ocr_coords.json', JSON.stringify(results, null, 2));
  console.log("OCR done. Found " + results.length + " matching words.");
  await worker.terminate();
}

doOCR().catch(console.error);
