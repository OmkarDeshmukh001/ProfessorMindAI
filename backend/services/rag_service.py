from backend.services.retrieval_service import retrieve_chunks
from backend.services.llm_service import generate_answer


def answer_question(query, file_id, top_k=3):

    # Retrieve relevant chunks
    results = retrieve_chunks(
        query=query,
        file_id=file_id,
        top_k=top_k
    )

    # Build context
    context_parts = []

    for result in results:

        context_parts.append(
            f"[Page {result['page_number']}]\n"
            f"{result['text']}"
        )

    context = "\n\n".join(context_parts)

    # Generate answer
    answer = generate_answer(
        query=query,
        context=context
    )

    return {
        "question": query,
        "answer": answer,
        "sources": [
            {
                "page_number": result["page_number"],
                "text": result["text"]
            }
            for result in results
        ]
    }
