import fitz
import json

doc = fitz.open("pics/inspection_.pdf")
page = doc[0]
words = page.get_text("words")

results = []
for w in words:
    x0, y0, x1, y1, word, block_no, line_no, word_no = w
    results.append({
        "text": word,
        "x": x0,
        "y": y0
    })

print(f"Found {len(results)} words.")
with open("pdf_words.json", "w") as f:
    json.dump(results, f, indent=2)
