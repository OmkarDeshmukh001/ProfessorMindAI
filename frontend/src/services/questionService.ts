import api from './api'
import type { QuestionRequest, QuestionResponse } from '../types/chat'

export async function askQuestion(data: QuestionRequest) {
	const response = await api.post<QuestionResponse>('/api/ask', data)
	return response.data
}
