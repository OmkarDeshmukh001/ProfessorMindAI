import api from "./api";
import type { DocumentListResponse } from "../types/api";
import type { Notebook } from "../types/notebook";

export async function listDocuments() {
  const response = await api.get<DocumentListResponse>("/api/documents");
  return response.data;
}

export async function getNotebookDocuments(notebookId: string) {
  const response = await api.get<Notebook>(
    `/api/notebooks/${encodeURIComponent(notebookId)}/documents`,
  );
  return response.data;
}

export async function deleteDocument(notebookId: string, fileId: string) {
  await api.delete(
    `/api/notebooks/${encodeURIComponent(notebookId)}/documents/${encodeURIComponent(fileId)}`,
  );
}
