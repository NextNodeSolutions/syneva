import type { Side } from '@shared/diff-renderer/types'

type ThreadLine = { side: Side; lineNumber: number }

// Expansion belongs to a renderer, not a file key, and it accumulates (each expandHunk widens the
// region): a thread is revealed once per renderer, while a revisit mounts another renderer with no
// expanded context. Weak ownership also releases old guards.
const revealed = new WeakMap<object, Set<string>>()

export function revealThreads(
	instance: object,
	threads: ThreadLine[],
	expand: (side: Side, line: number) => void,
): void {
	const done = revealed.get(instance) ?? new Set<string>()
	revealed.set(instance, done)
	for (const thread of threads) {
		const key = `${thread.side}:${thread.lineNumber}`
		if (done.has(key)) continue
		expand(thread.side, thread.lineNumber)
		done.add(key)
	}
}
