// Workers Logs ingests console output, one JSON object per line, so this is the signup's single console boundary; it logs what failed, never the address.
export function logFailure(event: string, error: unknown): void {
	const reason = error instanceof Error ? error.message : String(error)
	console.error(JSON.stringify({ event, reason }))
}
