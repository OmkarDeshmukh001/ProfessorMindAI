from backend.services.retrieval_service import retrieve_chunks
from backend.services.llm_service import generate_answer


def answer_question(
    query,
    file_id,
    top_k=3,
    distance_threshold=1.2
):

    # 1. Retrieve relevant chunks
    results = retrieve_chunks(
        query=query,
        file_id=file_id,
        top_k=top_k,
        distance_threshold=distance_threshold
    )

    # 2. Handle no relevant results
    if not results:
        return {
            "question": query,
            "answer": "I could not find relevant information in the uploaded material.",
            "sources": []
        }

    # 3. Build context
    context_parts = []

    for result in results:
        context_parts.append(
            f"[Page {result['page_number']}]\n"
            f"{result['text']}"
        )

    context = "\n\n".join(context_parts)

    # 4. Generate answer using LLM
    answer = generate_answer(
        query=query,
        context=context
    )

    # 5. Return answer with sources
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
