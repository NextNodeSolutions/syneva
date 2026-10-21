import { backoffMs } from './backoff'

// A read its source left unanswered, tried again when that source next answers, never on a timer:
// the source's own traffic (the hub's stream) says when it speaks, and the read waits for it.
export type AnswerRetry = {
	// The read was left unanswered: `again` runs once the source answers past the wait.
	failed: () => void
	// The read landed, or a newer one replaced it: nothing waits any more, and the wait starts
	// over from its shortest.
	settled: () => void
	// The source answered. `isFresh`: a new connection's first word (a hub's hello), which runs a
	// waiting read at once; any other answer runs it only past its wait.
	heard: (isFresh: boolean) => void
}

// The wait after each failure doubles (backoffMs), so a route that keeps failing while the source
// speaks (a broken route behind a live stream) is asked at most once a wait, and only while the
// source speaks. The wait is a deadline compared when the source answers. One `again` per failure:
// the caller says how it went with `failed` or `settled`.
export function createAnswerRetry(again: () => void): AnswerRetry {
	let failures = 0
	// When the waiting read may run again; null while none waits.
	let dueAt: number | null = null
	return {
		failed: () => {
			dueAt = Date.now() + backoffMs(failures)
			failures += 1
		},
		settled: () => {
			dueAt = null
			failures = 0
		},
		heard: isFresh => {
			if (dueAt === null || (!isFresh && Date.now() < dueAt)) return
			dueAt = null
			again()
		},
	}
}
