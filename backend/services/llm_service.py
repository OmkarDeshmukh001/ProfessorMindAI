import ollama


def generate_answer(query, context):

    prompt = f"""
You are ProfessorMind AI, a private learning assistant.

Answer the student's question ONLY using the provided context.

Rules:
1. Do not use outside knowledge.
2. If the answer is not present in the context, say:
   "I could not find this information in the uploaded material."
3. Give a clear and concise answer.
4. Mention the relevant page number when possible.

Context:
{context}

Student Question:
{query}

Answer:
"""

    response = ollama.chat(
        model="llama3.2",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]
