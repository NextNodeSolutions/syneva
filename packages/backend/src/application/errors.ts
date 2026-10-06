// Application-owned error the outbound adapters raise when a native/platform failure crosses into a use case: the adapter keeps the original message (user-facing wording unchanged) and chains the underlying failure as `cause`.

export class AdapterError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options)
		this.name = 'AdapterError'
	}
}

// The message an error carries, whatever shape it was thrown in; shared by the use cases surfacing a staged-patch conflict and by the HTTP failure responses.
export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}
