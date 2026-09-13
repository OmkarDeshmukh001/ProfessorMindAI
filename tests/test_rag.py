from backend.services.rag_service import answer_question


file_id = "472c8514-a600-44fa-b85e-32622eedd12e"

query = "Explain gradient descent algorithm?"


result = answer_question(
    query=query,
    file_id=file_id,
    top_k=3
)


print("\n==============================")
print("QUESTION")
print("==============================")

print(result["question"])


print("\n==============================")
print("ANSWER")
print("==============================")

print(result["answer"])


print("\n==============================")
print("SOURCES")
print("==============================")


for source in result["sources"]:

    print(f"\nPage: {source['page_number']}")
    print(source["text"][:300])
