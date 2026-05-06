import fitz
import sys

def convert_to_jpg(pdf_path, output_path):
    print("Loading", pdf_path)
    doc = fitz.open(pdf_path)
    page = doc[0]
    
    # Render page to an image
    # For a high-res form we can use zoom of ~2 (approx 144 DPI)
    mat = fitz.Matrix(2, 2)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    
    print("Saving to", output_path)
    pix.save(output_path)
    
convert_to_jpg("pics/inspection_.pdf", "public/inspection_template.jpg")
