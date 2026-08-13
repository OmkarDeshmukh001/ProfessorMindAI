from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.text_chunker import chunk_text


pdf_path = "storage/pdfs/472c8514-a600-44fa-b85e-32622eedd12e.pdf"

# Step 1: Extract text
pages = extract_text_from_pdf(pdf_path)

# Step 2: Create chunks
chunks = chunk_text(pages)

print(f"Total pages: {len(pages)}")
print(f"Total chunks: {len(chunks)}")

for i, chunk in enumerate(chunks, start=1):

    print("\n--------------------")
    print(f"Chunk {i}")
    print(f"Page: {chunk['page_number']}")
    print("--------------------")
    print(chunk["text"])
