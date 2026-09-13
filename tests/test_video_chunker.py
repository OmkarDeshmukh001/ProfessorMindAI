import json

from backend.services.video_chunker import chunk_transcript


# Load timestamped transcript
with open(
    "test_transcript.json",
    "r",
    encoding="utf-8"
) as f:

    transcript = json.load(f)


chunks = chunk_transcript(
    transcript["segments"],
    chunk_size=500,
    overlap=100
)


print("Total chunks:")
print(len(chunks))


print("\n===== FIRST 5 CHUNKS =====\n")

for chunk in chunks[:5]:

    print(
        f"Chunk {chunk['chunk_index']}"
    )

    print(
        f"Timestamp: "
        f"{chunk['start']:.2f}s - "
        f"{chunk['end']:.2f}s"
    )

    print(
        f"Source: {chunk['source_type']}"
    )

    print(
        f"Text: {chunk['text']}"
    )

    print("-" * 60)
