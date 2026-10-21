// The Worker's one log boundary (RFC 6.3, R8), as the landing's log-failure.server.ts: one Workers
// Logs JSON line, for an unexpected throw or a send that failed, never the address or a token. No
// route logs a request it answered.
export function logFailure(event: string, error: unknown): void {
	const reason = error instanceof Error ? error.message : String(error)
	console.error(JSON.stringify({ event, reason }))
}
