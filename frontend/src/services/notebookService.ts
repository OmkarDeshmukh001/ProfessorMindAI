import api from './api'
import type { CreateNotebookRequest, CreateNotebookResponse, Notebook, NotebookListResponse } from '../types/notebook'
import type { NotebookDeleteResponse } from '../types/api'

export async function listNotebooks() {
	const response = await api.get<NotebookListResponse>('/api/notebooks')
	return response.data
}

export async function getNotebook(notebookId: string) {
	const response = await api.get<Notebook>(`/api/notebooks/${notebookId}`)
	return response.data
}

export async function createNotebook(data: CreateNotebookRequest) {
	const response = await api.post<CreateNotebookResponse>('/api/notebooks', data)
	return response.data
}

export async function deleteNotebook(notebookId: string) {
	const response = await api.delete<NotebookDeleteResponse>(`/api/notebooks/${notebookId}`)
	return response.data
}
