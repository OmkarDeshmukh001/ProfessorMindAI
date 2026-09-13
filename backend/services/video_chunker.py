def chunk_transcript(
    segments,
    chunk_size=500,
    overlap=100
):
    """
    Convert Whisper timestamped segments into
    RAG-ready chunks while preserving timestamps.

    Args:
        segments: List of Whisper segments.
        chunk_size: Maximum approximate characters per chunk.
        overlap: Approximate character overlap between chunks.

    Returns:
        List of timestamped transcript chunks.
    """

    chunks = []

    current_text = []
    current_start = None
    current_end = None
    current_length = 0

    chunk_index = 0

    for segment in segments:

        text = segment["text"].strip()

        if not text:
            continue

        segment_start = float(segment["start"])
        segment_end = float(segment["end"])

        # Start a new chunk
        if current_start is None:
            current_start = segment_start

        current_text.append(text)
        current_end = segment_end
        current_length += len(text)

        # Create chunk when size is reached
        if current_length >= chunk_size:

            chunk_text = " ".join(current_text).strip()

            chunks.append({
                "chunk_index": chunk_index,
                "text": chunk_text,
                "start": current_start,
                "end": current_end,
                "source_type": "video"
            })

            chunk_index += 1

            # Keep overlap based on characters
            overlap_text = chunk_text[-overlap:]

            current_text = [overlap_text]
            current_length = len(overlap_text)

            current_start = segment_start

    # Add remaining text
    if current_text:

        chunk_text = " ".join(current_text).strip()

        chunks.append({
            "chunk_index": chunk_index,
            "text": chunk_text,
            "start": current_start,
            "end": current_end,
            "source_type": "video"
        })

    return chunks
