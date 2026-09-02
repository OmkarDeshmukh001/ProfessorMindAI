from backend.services.embedding_service import model

from backend.services.vector_store import (
    load_faiss_index,
    search_faiss
)


def retrieve_chunks(
    query,
    file_id,
    top_k=8,
    distance_threshold=1.2
):

    index, chunks = load_faiss_index(file_id)

    query_embedding = model.encode(
        [query],
        convert_to_numpy=True
    )

    results = search_faiss(
        index=index,
        chunks=chunks,
        query_embedding=query_embedding,
        top_k=top_k,
        distance_threshold=distance_threshold
    )

    return results
