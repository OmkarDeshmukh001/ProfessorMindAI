import json

from backend.services.video_chunker import chunk_transcript
from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import add_to_notebook_faiss


# Your existing notebook
notebook_id = "f048190f-5ebf-495c-ab12-cfbcdae0eba9"

# Your uploaded video
file_id = "f7b5da3d-6ccd-4411-9ad8-131aec006968"


# --------------------------------------------------
# 1. Load Whisper transcript
# --------------------------------------------------

with open(
    "test_transcript.json",
    "r",
    encoding="utf-8"
) as f:

    transcript = json.load(f)


# --------------------------------------------------
# 2. Create video chunks
# --------------------------------------------------

chunks = chunk_transcript(
    transcript["segments"],
    chunk_size=500,
    overlap=100
)


# --------------------------------------------------
# 3. Add video metadata
# --------------------------------------------------

for chunk in chunks:

    chunk["file_id"] = file_id
    chunk["source_type"] = "video"


# --------------------------------------------------
# 4. Generate embeddings
# --------------------------------------------------

embeddings = generate_embeddings(chunks)


print("===== VIDEO FAISS TEST =====")

print("Video chunks:", len(chunks))

print("Embeddings:", len(embeddings))

print("Embedding dimension:", embeddings.shape[1])


# --------------------------------------------------
# 5. Add to notebook FAISS
# --------------------------------------------------

index, all_chunks = add_to_notebook_faiss(
    notebook_id,
    embeddings,
    chunks
)


# --------------------------------------------------
# 6. Verify
# --------------------------------------------------

print("\n===== FAISS RESULT =====")

print("FAISS vectors:", index.ntotal)

print("Total metadata chunks:", len(all_chunks))


print("\n===== VIDEO METADATA =====")

for chunk in all_chunks[-len(chunks):]:

    print(
        f"Chunk {chunk['chunk_index']} | "
        f"{chunk['start']:.2f}s - "
        f"{chunk['end']:.2f}s | "
        f"file_id={chunk['file_id']} | "
        f"type={chunk['source_type']}"
    )


print("\nModule 19.9 test completed.")
