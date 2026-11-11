import { answerApi } from './api/answer-api'
import { createMockSource } from './source/mock/mock-source'

export default {
	fetch: request => answerApi(request, createMockSource()),
} satisfies ExportedHandler
