from backend.services.retrieval_service import retrieve_chunks
from backend.services.context_builder import build_context
from backend.services.llm_service import generate_answer


def answer_question(query, notebook_id, top_k=8, distance_threshold=1.2):

    results = retrieve_chunks(
        query=query,
        notebook_id=notebook_id,
        top_k=top_k,
        distance_threshold=distance_threshold
    )

    if not results:
        return {
            "question": query,
            "answer": "This question is outside the scope of the uploaded notes.",
            "sources": []
        }

    context = build_context(results)

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
                "text": result["text"],
                "distance": result["distance"]
            }
            for result in results
        ]
    }
