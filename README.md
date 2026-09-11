# ProfessorMind AI

## Professor-Centric Multimodal AI Learning Assistant

ProfessorMind AI is a private, professor-centric AI learning assistant that allows students to build subject-specific knowledge bases from their own academic materials.

The system uses **Retrieval-Augmented Generation (RAG)** to retrieve relevant information from uploaded lecture notes and generate answers using a locally hosted Large Language Model.

The long-term goal is to extend the system from PDF-based learning to a **multimodal learning assistant** supporting videos, audio, images, OCR, and lecture understanding.

---

## Project Overview

Students often have lecture notes, PDFs, presentations, recorded lectures, and handwritten materials spread across different locations.

ProfessorMind AI provides a centralized personal knowledge base for each subject.

Each subject is represented as a **Notebook**, and every notebook has its own knowledge base and FAISS vector index.

```text
Student
│
├── NLP Notebook
│   ├── HMM.pdf
│   ├── POS.pdf
│   └── NLP FAISS Knowledge Base
│
├── Machine Learning Notebook
│   ├── Regression.pdf
│   ├── Classification.pdf
│   └── ML FAISS Knowledge Base
│
└── Deep Learning Notebook
    ├── CNN.pdf
    ├── RNN.pdf
    └── DL FAISS Knowledge Base
```

---

## Current Features

### Notebook Management

- Create notebooks
- Store notebook metadata
- List all notebooks
- View individual notebooks
- Delete complete notebooks
- Maintain separate storage for each notebook

### PDF Knowledge Base

- Upload PDF files to a selected notebook
- Extract text from PDFs
- Split extracted text into chunks
- Generate vector embeddings
- Store embeddings in notebook-specific FAISS indexes
- Support multiple PDFs inside one notebook

### Retrieval-Augmented Generation

- Query a complete notebook knowledge base
- Retrieve relevant chunks from multiple PDFs
- Maintain page ordering
- Remove duplicate chunks
- Apply retrieval distance filtering
- Generate answers using a locally hosted LLM
- Return source information including PDF and page references
- Reject questions outside the uploaded knowledge base

### Document Management

- View documents inside a notebook
- View document metadata
- Delete individual PDFs
- Rebuild notebook FAISS after document deletion
- Delete complete notebook storage

---

## Technology Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite

### Document Processing

- PyMuPDF
- Python-based text chunking

### Embeddings

- Sentence Transformers
- `all-MiniLM-L6-v2`
- 384-dimensional embeddings

### Vector Database

- FAISS
- `IndexFlatL2`

### Large Language Model

- Ollama
- Llama 3.2

### API Documentation

- Swagger UI
- OpenAPI

### Frontend

A basic React-based frontend is currently under development.

Planned technologies:

- React.js
- Vite
- Tailwind CSS
- Axios

---

## System Architecture

```text
                    ┌─────────────────────┐
                    │       Student       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Notebook       │
                    │   (Subject-based)   │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
              PDF 1         PDF 2         PDF 3
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Text Extraction   │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │      Chunking       │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │     Embeddings      │
                    │  all-MiniLM-L6-v2   │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Notebook FAISS    │
                    └──────────┬──────────┘
                               │
                         User Question
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Retrieval      │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │  Context Building   │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │      Llama 3.2      │
                    │   Local Generation  │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Answer + Sources  │
                    └─────────────────────┘
```

---

## Storage Architecture

Each notebook has its own source files and FAISS knowledge base.

```text
storage/
└── notebooks/
    │
    ├── <notebook_id>/
    │   ├── sources/
    │   │   ├── document_1.pdf
    │   │   └── document_2.pdf
    │   │
    │   └── faiss/
    │       ├── index.faiss
    │       └── metadata.pkl
    │
    └── <notebook_id>/
        ├── sources/
        └── faiss/
```

This architecture ensures that documents belonging to different subjects do not share the same vector knowledge base.

---

## API Endpoints

### Notebook APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notebooks` | Create a notebook |
| GET | `/api/notebooks` | Get all notebooks |
| GET | `/api/notebooks/{notebook_id}` | Get a specific notebook |
| DELETE | `/api/notebooks/{notebook_id}` | Delete a notebook |

### PDF APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notebooks/{notebook_id}/upload-pdf` | Upload and process PDF |
| GET | `/api/notebooks/{notebook_id}/documents` | List notebook documents |
| DELETE | `/api/notebooks/{notebook_id}/documents/{file_id}` | Delete a PDF |

### RAG API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ask` | Ask a question using notebook knowledge |

### Example Request

```json
{
  "notebook_id": "your-notebook-id",
  "question": "Explain Hidden Markov Model",
  "top_k": 8
}
```

---

## RAG Pipeline

The current PDF RAG pipeline works as follows:

```text
PDF Upload
    ↓
PDF Text Extraction
    ↓
Text Chunking
    ↓
Embedding Generation
    ↓
Notebook-specific FAISS
    ↓
User Question
    ↓
Query Embedding
    ↓
Similarity Search
    ↓
Relevant Chunks
    ↓
Context Construction
    ↓
Llama 3.2
    ↓
Answer + Sources
```

The system is designed to answer questions using the uploaded notebook knowledge base rather than relying on unsupported external information.

---

## Project Structure

```text
ProfessorMindAI/
│
├── backend/
│   ├── api/
│   │   ├── document.py
│   │   ├── notebook.py
│   │   ├── question.py
│   │   └── upload.py
│   │
│   ├── models/
│   │   ├── document.py
│   │   └── notebook.py
│   │
│   ├── services/
│   │   ├── context_builder.py
│   │   ├── embedding_service.py
│   │   ├── llm_service.py
│   │   ├── pdf_extractor.py
│   │   ├── rag_service.py
│   │   ├── retrieval_service.py
│   │   ├── text_chunker.py
│   │   └── vector_store.py
│   │
│   ├── database.py
│   └── main.py
│
├── storage/
│   └── notebooks/
│
├── professormind.db
│
├── requirements.txt
└── README.md
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/OmkarDeshmukh001/ProfessorMindAI.git
cd ProfessorMindAI
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

#### Windows Git Bash

```bash
source venv/Scripts/activate
```

#### Windows CMD

```cmd
venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Ollama Setup

Install Ollama and make sure Llama 3.2 is available locally.

Pull the model:

```bash
ollama pull llama3.2
```

Verify:

```bash
ollama list
```

---

## Run the Backend

From the project root:

```bash
python -m uvicorn backend.main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Development Status

### Completed

- [x] FastAPI backend
- [x] SQLite database
- [x] Notebook creation
- [x] Notebook-specific storage
- [x] PDF upload
- [x] PDF text extraction
- [x] Text chunking
- [x] Sentence Transformer embeddings
- [x] Notebook-specific FAISS
- [x] Multi-PDF notebook knowledge base
- [x] Notebook-based retrieval
- [x] Context construction
- [x] Local Llama 3.2 integration
- [x] RAG question answering
- [x] Source/page references
- [x] PDF deletion
- [x] FAISS rebuilding after PDF deletion
- [x] Notebook deletion

### In Progress

- [ ] Basic React frontend
- [ ] Frontend-backend integration
- [ ] Video ingestion
- [ ] Whisper speech-to-text
- [ ] Timestamp-based video retrieval
- [ ] Image/OCR processing
- [ ] Multimodal retrieval
- [ ] Multimodal RAG
- [ ] Authentication
- [ ] Student/user management

---

## Future Multimodal Architecture

The final system is planned to support multiple academic media types:

```text
                         Notebook
                            │
              ┌─────────────┼─────────────┐
              │             │             │
             PDF          Video         Image
              │             │             │
           PyMuPDF        Whisper          OCR
              │             │             │
              └─────────────┼─────────────┘
                            │
                      Multimodal
                    Knowledge Base
                            │
                          FAISS
                            │
                           RAG
                            │
                        Local LLM
                            │
                            ▼
                   Personalized Answer
```

Future versions may also incorporate audio understanding, lecture-level video retrieval, timestamp references, and multimodal question answering.

---

## Project Goals

ProfessorMind AI aims to provide:

- Private academic knowledge retrieval
- Subject-specific knowledge bases
- Professor lecture material understanding
- Multi-document question answering
- Source-grounded responses
- Local LLM inference
- Multimodal lecture understanding
- Personalized student learning assistance

---

## Disclaimer

ProfessorMind AI is an academic project and research prototype developed for educational purposes.

The current implementation focuses primarily on **PDF-based Retrieval-Augmented Generation**. Multimodal capabilities are planned for future development.

---

## GitHub Update

After replacing the README:

```bash
git add README.md
git commit -m "Add comprehensive project README"
git push origin main
```
