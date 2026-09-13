from backend.services.vector_store import (
    load_notebook_faiss,
    search_faiss
)
from backend.services.embedding_service import model
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


# ==========================================
# Configuration
# ==========================================

NOTEBOOK_ID = "f048190f-5ebf-495c-ab12-cfbcdae0eba9"

QUESTIONS = [
    {
        "name": "Relevant video question",
        "question": "What determines how much influence each input has on the output?"
    },
    {
        "name": "Relevant neural network question",
        "question": "What are the different layers of a neural network?"
    },
    {
        "name": "Out-of-scope question",
        "question": "What is the capital of France?"
    }
]


# ==========================================
# Load notebook FAISS
# ==========================================

index, chunks = load_notebook_faiss(
    NOTEBOOK_ID
)


if index is None:
    print("ERROR: FAISS index not found.")
    exit()


print("=" * 60)
print("RETRIEVAL QUALITY TEST")
print("=" * 60)

print(f"FAISS vectors   : {index.ntotal}")
print(f"Metadata chunks : {len(chunks)}")
print("=" * 60)


# ==========================================
# Test each question
# ==========================================

for item in QUESTIONS:

    question = item["question"]

    print("\n")
    print("-" * 60)
    print(item["name"])
    print("-" * 60)

    print(f"Question: {question}")
    print()

    # --------------------------------------
    # Create query embedding
    # --------------------------------------

    query_embedding = model.encode(
        [question],
        convert_to_numpy=True
    )

    # --------------------------------------
    # Search WITHOUT threshold filtering
    # --------------------------------------
    #
    # Very large threshold so we can inspect
    # the actual nearest-neighbor distances.
    # --------------------------------------

    results = search_faiss(
        index=index,
        chunks=chunks,
        query_embedding=query_embedding,
        top_k=10,
        distance_threshold=999.0
    )

    if not results:
        print("No results found.")
        continue

    # --------------------------------------
    # Display results
    # --------------------------------------

    for i, result in enumerate(results, start=1):

        source_type = result.get(
            "source_type",
            "pdf"
        )

        distance = result.get(
            "distance"
        )

        print(f"\nResult {i}")
        print(f"Distance    : {distance:.4f}")
        print(f"Source type : {source_type}")
        print(f"File ID     : {result.get('file_id')}")

        if source_type == "pdf":

            print(
                f"Page        : "
                f"{result.get('page_number')}"
            )

        elif source_type == "video":

            print(
                f"Timestamp   : "
                f"{result.get('start'):.2f}s - "
                f"{result.get('end'):.2f}s"
            )

        text = result.get(
            "text",
            ""
        ).replace("\n", " ")

        print(
            f"Text        : "
            f"{text[:250]}"
        )


print("\n")
print("=" * 60)
print("TEST COMPLETE")
print("=" * 60)
