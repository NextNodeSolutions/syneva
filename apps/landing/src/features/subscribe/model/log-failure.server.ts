// The Worker's log boundary: Workers Logs ingests console output, one JSON
// object per line, so this is the one place the signup reaches the console.
// It logs what failed and why, never the address.
export function logFailure(event: string, error: unknown): void {
	const reason = error instanceof Error ? error.message : String(error)
	console.error(JSON.stringify({ event, reason }))
}
