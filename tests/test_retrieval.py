from backend.services.retrieval_service import retrieve_chunks


file_id = "472c8514-a600-44fa-b85e-32622eedd12e"

query = "what is autoencoders?"


results = retrieve_chunks(
    query,
    file_id,
    top_k=3
)


print(f"Query: {query}")
print(f"Retrieved chunks: {len(results)}")


for i, result in enumerate(results, start=1):

    print("\n====================")
    print(f"Result {i}")
    print(f"Page: {result['page_number']}")
    print(f"Distance: {result['distance']}")
    print("====================")

    print(result["text"])
