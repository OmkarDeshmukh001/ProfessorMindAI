from backend.services.retrieval_service import retrieve_chunks
from backend.services.context_builder import build_context
from backend.services.llm_service import generate_answer


# ==================================================
# Answer Question Using Notebook RAG
# ==================================================

def answer_question(
    query,
    notebook_id,
    top_k=8,
    distance_threshold=1.2
):

    # ------------------------------------------
    # 1. Retrieve relevant chunks
    # ------------------------------------------

    results = retrieve_chunks(
        query=query,
        notebook_id=notebook_id,
        top_k=top_k,
        distance_threshold=distance_threshold
    )

    # ------------------------------------------
    # 2. No relevant information found
    # ------------------------------------------

    if not results:

        return {
            "question": query,
            "answer": (
                "This question is outside the scope "
                "of the uploaded notes."
            ),
            "sources": []
        }

    # ------------------------------------------
    # 3. Build context
    # ------------------------------------------

    context = build_context(
        results
    )

    # ------------------------------------------
    # 4. Generate answer using LLM
    # ------------------------------------------

    answer = generate_answer(
        query=query,
        context=context
    )

    # ------------------------------------------
    # 5. Prepare sources
    # ------------------------------------------

    sources = []

    for result in results:

        sources.append({
            "file_id": result.get("file_id"),
            "page_number": result.get(
                "page_number"
            ),
            "chunk_index": result.get(
                "chunk_index"
            ),
            "text": result.get(
                "text"
            ),
            "distance": result.get(
                "distance"
            )
        })

    # ------------------------------------------
    # 6. Return final response
    # ------------------------------------------

    return {
        "question": query,
        "answer": answer,
        "sources": sources
    }
