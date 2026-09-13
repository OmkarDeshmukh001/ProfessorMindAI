from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import (
    load_notebook_faiss,
    search_faiss
)


# ---------------------------------
# Notebook
# ---------------------------------

notebook_id = "f048190f-5ebf-495c-ab12-cfbcdae0eba9"


# ---------------------------------
# Test question
# ---------------------------------

question = "What are the different layers of a neural network?"


# ---------------------------------
# Load notebook FAISS
# ---------------------------------

index, chunks = load_notebook_faiss(
    notebook_id
)

print("===== VIDEO RETRIEVAL TEST =====")

print("FAISS vectors:", index.ntotal)

print("Metadata chunks:", len(chunks))


# ---------------------------------
# Create query embedding
# ---------------------------------

query_chunk = [
    {
        "text": question
    }
]

query_embedding = generate_embeddings(
    query_chunk
)


# ---------------------------------
# Search FAISS
# ---------------------------------

results = search_faiss(
    index,
    chunks,
    query_embedding,
    top_k=5,
    distance_threshold=1.2
)


# ---------------------------------
# Display results
# ---------------------------------

print("\n===== RETRIEVED RESULTS =====")

print("Results found:", len(results))


for i, result in enumerate(
    results,
    start=1
):

    print(f"\n--- Result {i} ---")

    print(
        "Source type:",
        result["source_type"]
    )

    print(
        "File ID:",
        result["file_id"]
    )

    print(
        "Chunk index:",
        result["chunk_index"]
    )

    if result["source_type"] == "video":

        print(
            f"Timestamp: "
            f"{result['start']:.2f}s - "
            f"{result['end']:.2f}s"
        )

    else:

        print(
            "Page:",
            result["page_number"]
        )

    print(
        "Distance:",
        result["distance"]
    )

    print(
        "Text:",
        result["text"]
    )


print("\nModule 19.10 test completed.")
