import faiss
import numpy as np
import pickle
from pathlib import Path


FAISS_DIR = Path("storage/faiss")
FAISS_DIR.mkdir(parents=True, exist_ok=True)


def create_faiss_index(embeddings):

    embeddings = np.asarray(embeddings).astype("float32")

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)

    index.add(embeddings)

    return index


def save_faiss_index(index, chunks, file_id):

    index_path = FAISS_DIR / f"{file_id}.index"
    metadata_path = FAISS_DIR / f"{file_id}.pkl"

    # Save FAISS index
    faiss.write_index(index, str(index_path))

    # Save chunk metadata
    with open(metadata_path, "wb") as f:
        pickle.dump(chunks, f)

    return index_path, metadata_path


def load_faiss_index(file_id):

    index_path = FAISS_DIR / f"{file_id}.index"
    metadata_path = FAISS_DIR / f"{file_id}.pkl"

    index = faiss.read_index(str(index_path))

    with open(metadata_path, "rb") as f:
        chunks = pickle.load(f)

    return index, chunks


def search_faiss(index, chunks, query_embedding, top_k=3):

    query_embedding = np.asarray(query_embedding).astype("float32")

    distances, indices = index.search(query_embedding, top_k)

    results = []

    for distance, index_position in zip(distances[0], indices[0]):

        if index_position == -1:
            continue

        results.append({
            "text": chunks[index_position]["text"],
            "page_number": chunks[index_position]["page_number"],
            "distance": float(distance)
        })

    return results
