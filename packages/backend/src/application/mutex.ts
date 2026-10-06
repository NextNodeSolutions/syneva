// Enqueue order (not completion order) sets the run order, so callers must enqueue synchronously for a guaranteed sequence.
// A rejected task settles the chain WITHOUT poisoning it (the tail promise tracks completion, the returned promise still rejects).
export type Serializer = <T>(fn: () => Promise<T>) => Promise<T>

export function createSerializer(): Serializer {
	let tail: Promise<void> = Promise.resolve()
	return serialize

	async function serialize<T>(fn: () => Promise<T>): Promise<T> {
		const previous = tail
		const outcome = runAfter(previous, fn)
		tail = trackCompletion(outcome)
		return outcome
	}
}

async function runAfter<T>(
	previous: Promise<void>,
	fn: () => Promise<T>,
): Promise<T> {
	await previous
	return fn()
}

async function trackCompletion(outcome: Promise<unknown>): Promise<void> {
	try {
		await outcome
	} catch {
		// The caller owns `fn`'s rejection; the queue only needs completion.
	}
}
