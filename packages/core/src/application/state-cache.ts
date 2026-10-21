// Building the /state body is not cheap (browserState walks every change of a diff that can span a whole PR, then stringify copies it) and the tab re-reads it whenever the diff moves.
// It is a function of exactly two inputs that do not stand in for each other: the revision covers the review half (it advances only when a mutation commits a different root); the transient half (DeskStatus + serverInstanceId) describes the desk PROCESS, not the review.
// Reads stay outside the write mutex (copy-on-write state gives a reader one immutable root, never an intermediate).
export type StateBodyCache = {
	// `render` runs only on a miss and is called here rather than handed in pre-built, so a request can never pair a body it rendered with a key that no longer holds.
	body(revision: number, transientKey: string, render: () => string): string
}

export function createStateBodyCache(): StateBodyCache {
	let cached: {
		revision: number
		transientKey: string
		body: string
	} | null = null
	return {
		body(revision, transientKey, render) {
			if (
				cached?.revision === revision &&
				cached.transientKey === transientKey
			)
				return cached.body
			const body = render()
			cached = { revision, transientKey, body }
			return body
		},
	}
}
