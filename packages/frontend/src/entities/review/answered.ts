import type { ReviewComment } from './model'

type Threaded = Pick<ReviewComment, 'intent' | 'status' | 'role' | 'createdAt'>

function repliedAt(messages: readonly Threaded[]): number {
	const times = messages
		.filter(message => message.role === 'agent')
		.map(message => +new Date(message.createdAt))
		.filter(time => !Number.isNaN(time))
	return Math.max(0, ...times)
}

// The hub's own rule for a Send's openQuestions (computeOpenQuestions), for a line thread or a domain thread: every open question of the reviewer's has an agent reply after it. A follow-up asked after the last answer puts the thread back to waiting; a thread without a question is never "answered".
export function isAnswered(messages: readonly Threaded[]): boolean {
	const questions = messages.filter(
		message =>
			message.intent === 'question' &&
			message.status === 'open' &&
			message.role !== 'agent',
	)
	if (!questions.length) return false
	const latestReply = repliedAt(messages)
	return questions.every(
		question => latestReply > +new Date(question.createdAt),
	)
}
