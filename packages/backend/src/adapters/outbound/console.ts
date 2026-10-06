// stdout is the machine channel (tagged JSON envelopes, `syneva spec`, the version) and stderr every human-facing diagnostic.
// Routing both through here keeps console.* and its stdout/stderr mixing out of the domain code, so the agent contract stays exactly the bytes written here.
export function printLine(text: string): void {
	process.stdout.write(`${text}\n`)
}

export function printJson(payload: unknown): void {
	process.stdout.write(`${JSON.stringify(payload)}\n`)
}

export function warn(text: string): void {
	process.stderr.write(`${text}\n`)
}

// A long-running process is read back later (a detached hub writes to ~/.syneva/hub/hub.log), so every entry says when it happened.
export function hubLog(text: string): void {
	warn(`${new Date().toISOString()} ${text}`)
}
