// The CLI's process-output boundary. stdout is the machine channel - the tagged JSON
// envelopes (`await`/`comment`/`status`/`reload`/`stop`), `syneva spec`, and the version -
// while stderr carries every human-facing diagnostic. Routing both through this module keeps
// `console.*` (and its accidental stdout/stderr mixing) out of the domain code, so the agent
// contract stays exactly the bytes written here.
export function printLine(text: string): void {
	process.stdout.write(`${text}\n`)
}

export function printJson(payload: unknown): void {
	process.stdout.write(`${JSON.stringify(payload)}\n`)
}

export function warn(text: string): void {
	process.stderr.write(`${text}\n`)
}

// The hub's own log line: a long-running process is read back later (a detached hub writes to
// ~/.syneva/hub/hub.log), so every entry says when it happened.
export function hubLog(text: string): void {
	warn(`${new Date().toISOString()} ${text}`)
}
