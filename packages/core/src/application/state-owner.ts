import type { ReviewState } from '../domain/review.js'

export type StateOwner = {
	readonly state: ReviewState
	readonly revision: number
	commit: (next: ReviewState) => void
}

export function createStateOwner(initial: ReviewState): StateOwner {
	// The startup root is frozen ONCE at the ownership boundary: after publication neither the caller's object nor any shared branch may be edited, or a mutation could become visible without a commit (stale revision, stale /state cache body).
	// Committed roots are NOT re-frozen per mutation - the copy-on-write use cases build them fresh; the types (transitively readonly ReviewState) carry the rest.
	deepFreeze(initial)
	let current = initial
	let revision = 0
	return {
		get state(): ReviewState {
			return current
		},
		get revision(): number {
			return revision
		},
		commit(next: ReviewState): void {
			if (next === current) return
			current = next
			revision += 1
		},
	}
}

function deepFreeze(node: unknown): void {
	if (node && typeof node === 'object') {
		for (const child of Object.values(node)) deepFreeze(child)
		Object.freeze(node)
	}
}
