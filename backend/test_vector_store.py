from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.text_chunker import chunk_text
from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import (
    create_faiss_index,
    save_faiss_index
)


pdf_path = "storage/pdfs/472c8514-a600-44fa-b85e-32622eedd12e.pdf"

file_id = "472c8514-a600-44fa-b85e-32622eedd12e"


# Step 1: Extract text
pages = extract_text_from_pdf(pdf_path)

# Step 2: Create chunks
chunks = chunk_text(pages)

# Step 3: Generate embeddings
embeddings = generate_embeddings(chunks)

# Step 4: Create FAISS index
index = create_faiss_index(embeddings)

# Step 5: Save FAISS index + metadata
index_path, metadata_path = save_faiss_index(
    index,
    chunks,
    file_id
)


print(f"Total chunks: {len(chunks)}")
print(f"FAISS vectors: {index.ntotal}")
print(f"Vector dimension: {index.d}")
print(f"Index saved at: {index_path}")
print(f"Metadata saved at: {metadata_path}")
