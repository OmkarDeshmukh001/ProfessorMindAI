from backend.services.embedding_service import model
from backend.services.vector_store import (
    load_faiss_index,
    search_faiss
)


def retrieve_chunks(query, file_id, top_k=3):

    # Load FAISS index and metadata
    index, chunks = load_faiss_index(file_id)

    # Convert question into embedding
    query_embedding = model.encode(
        [query],
        convert_to_numpy=True
    )

    # Search FAISS
    results = search_faiss(
        index,
        chunks,
        query_embedding,
        top_k
    )

    return results
