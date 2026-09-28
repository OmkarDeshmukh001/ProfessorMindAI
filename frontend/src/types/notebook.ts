export interface DocumentRecord {
	file_id: string
	filename: string
	stored_as: string
	total_pages: number | null
	total_chunks: number | null
	embedding_dimension: number | null
	status: string
	uploaded_at: string
}

export interface Notebook {
	notebook_id: string
	name: string
	description: string | null
	created_at: string
	total_documents: number
	documents: DocumentRecord[]
}

export interface NotebookListResponse {
	total_notebooks: number
	notebooks: Notebook[]
}

export interface CreateNotebookRequest {
	name: string
	description?: string | null
}

export interface CreateNotebookResponse {
	message: string
	notebook_id: string
	name: string
	description: string | null
	created_at: string
}
