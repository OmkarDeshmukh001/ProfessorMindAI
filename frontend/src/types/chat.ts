export interface QuestionRequest {
	notebook_id: string
	question: string
	top_k?: number
}

export interface ChatSource {
	file_id: string | null
	filename: string | null
	page_number: number | null
}

export interface QuestionResponse {
	question: string
	answer: string
	sources: ChatSource[]
}
