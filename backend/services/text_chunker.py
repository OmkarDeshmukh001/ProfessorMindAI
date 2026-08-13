from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_text(pages):

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = []

    for page in pages:

        page_chunks = text_splitter.split_text(page["text"])

        for chunk in page_chunks:

            chunks.append({
                "page_number": page["page_number"],
                "text": chunk
            })

    return chunks
