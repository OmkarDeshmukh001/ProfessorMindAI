import type { DocumentRecord } from "./notebook";

export interface UploadResponse {
  message: string;
  notebook_id: string;
  notebook_name: string;
  file_id: string;
  filename: string;
  stored_as: string;
  file_type?: string;

  total_pages?: number;
  total_chunks?: number;
  embedding_dimension?: number;
  faiss_vectors?: number;
  notebook_chunks?: number;

  status: string;
}

export interface DocumentGroup {
  notebook_id: string;
  notebook_name: string;
  description: string | null;
  created_at: string;
  total_documents: number;
  documents: DocumentRecord[];
}

export interface DocumentListResponse {
  total_notebooks: number;
  notebooks: DocumentGroup[];
}

export interface NotebookDeleteResponse {
  message: string;
  notebook_id: string;
  deleted_documents: number;
}
