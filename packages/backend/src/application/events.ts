import type { AwaitEvent, QuestionPayload } from '@syneva/contracts/agent'

export type EventStream = {
	emit(event: AwaitEvent): void
	takeNext(): AwaitEvent | undefined
	park(waiter: (event: AwaitEvent) => void): () => void
	listenerCount(): number
	queuedCounts(): { questions: number; reviews: number }
}

// `syneva await` streams "question" (answer now) and "review" (Send); an event hands to a parked waiter, else queues FIFO.
// Two invariant rules live here rather than in the routes: a Send flushes every still-queued question (the review supersedes them; their unanswered ones ride out in result.openQuestions - a stale question can never dribble in after the round).
// Draining all queued questions into one event is safe BECAUSE of that flush (a review can never sit between two queued questions, so a batch can't skip past one).
export function createEventStream(): EventStream {
	const waiters: Array<(event: AwaitEvent) => void> = []
	const queue: AwaitEvent[] = []
	return {
		emit(event: AwaitEvent): void {
			if (event.kind === 'review') dropQueuedQuestions(queue)
			const waiter = waiters.shift()
			if (waiter) waiter(event)
			else queue.push(event)
		},
		takeNext(): AwaitEvent | undefined {
			if (!queue.length) return undefined
			const [head] = queue
			if (!head) return undefined
			if (head.kind !== 'question') return queue.shift()
			return drainQuestions(queue)
		},
		park(waiter: (event: AwaitEvent) => void): () => void {
			waiters.push(waiter)
			return () => {
				const index = waiters.indexOf(waiter)
				if (index >= 0) waiters.splice(index, 1)
			}
		},
		listenerCount(): number {
			return waiters.length
		},
		queuedCounts(): { questions: number; reviews: number } {
			return {
				questions: queue.filter(event => event.kind === 'question')
					.length,
				reviews: queue.filter(event => event.kind === 'review').length,
			}
		},
	}
}

function drainQuestions(queue: AwaitEvent[]): AwaitEvent | undefined {
	const batched: QuestionPayload[] = []
	for (let index = queue.length - 1; index >= 0; index--) {
		const event = queue[index]
		if (event?.kind !== 'question') continue
		batched.unshift(...event.questions)
		queue.splice(index, 1)
	}
	const [oldest] = batched
	if (!oldest) return undefined
	return { kind: 'question', question: oldest, questions: batched }
}

function dropQueuedQuestions(queue: AwaitEvent[]): void {
	for (let index = queue.length - 1; index >= 0; index--) {
		const event = queue[index]
		if (event?.kind === 'question') queue.splice(index, 1)
	}
}
