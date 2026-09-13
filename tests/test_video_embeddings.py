import json

from backend.services.video_chunker import chunk_transcript
from backend.services.embedding_service import generate_embeddings


# Load Whisper transcript
with open(
    "test_transcript.json",
    "r",
    encoding="utf-8"
) as f:

    transcript = json.load(f)


# Create video chunks
chunks = chunk_transcript(
    transcript["segments"],
    chunk_size=500,
    overlap=100
)


# Generate embeddings
embeddings = generate_embeddings(chunks)


print("===== VIDEO EMBEDDING TEST =====")

print("Total chunks:", len(chunks))

print("Total embeddings:", len(embeddings))

print("Embedding dimension:", embeddings.shape[1])

print("Expected dimension: 384")


# Verify count
if len(chunks) == len(embeddings):
    print("\n✓ Chunk count matches embedding count")
else:
    print("\n✗ Chunk count does NOT match embedding count")


# Verify dimension
if embeddings.shape[1] == 384:
    print("✓ Embedding dimension is 384")
else:
    print("✗ Incorrect embedding dimension")


# Show first embedding
print("\nFirst embedding:")
print(embeddings[0][:10])

print("\nModule 19.8 test completed.")
