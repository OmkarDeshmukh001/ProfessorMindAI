from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_text(pages):

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = []

    chunk_index = 0

    for page in pages:

        page_chunks = text_splitter.split_text(
            page["text"]
        )

        for page_chunk_index, chunk in enumerate(page_chunks):

            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page["page_number"],
                "page_chunk_index": page_chunk_index,
                "text": chunk
            })

            chunk_index += 1

    return chunks
