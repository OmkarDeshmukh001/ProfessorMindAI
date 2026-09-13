from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.text_chunker import chunk_text
from backend.services.embedding_service import generate_embeddings


pdf_path = "storage/pdfs/472c8514-a600-44fa-b85e-32622eedd12e.pdf"


# Step 1: Extract PDF text
pages = extract_text_from_pdf(pdf_path)

# Step 2: Create chunks
chunks = chunk_text(pages)

# Step 3: Generate embeddings
embeddings = generate_embeddings(chunks)


print(f"Total chunks: {len(chunks)}")
print(f"Embedding shape: {embeddings.shape}")

print("\nFirst chunk:")
print(chunks[0]["text"])

print("\nFirst embedding:")
print(embeddings[0])
