export const DOCS = 'Run `syneva spec` for the full agent contract.'

// The wire shape of an error response, and the only place a route failure is described; `fix` is what the agent-facing callers act on, so it must say what to do next.
export type ApiFailure = {
	status: number
	code: string
	error: string
	fix: string
}

export const BAD_PATH: ApiFailure = {
	status: 400,
	code: 'BAD_PATH',
	error: 'Path escapes the repo.',
	fix: 'Use a repo-relative path.',
}

export function cannotRead(rel: string): ApiFailure {
	return {
		status: 404,
		code: 'NOT_FOUND',
		error: `Cannot read "${rel}".`,
		fix: 'Check the path is a readable file in the repo.',
	}
}
