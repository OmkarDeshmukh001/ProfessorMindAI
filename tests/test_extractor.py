from backend.services.pdf_extractor import extract_text_from_pdf

pdf_path = "storage/pdfs/472c8514-a600-44fa-b85e-32622eedd12e.pdf"

pages = extract_text_from_pdf(pdf_path)

print(f"Total pages: {len(pages)}")

for page in pages:
    print("\n--------------------")
    print(f"Page {page['page_number']}")
    print("--------------------")
    print(page["text"][:1000])
