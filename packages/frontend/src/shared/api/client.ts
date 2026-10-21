import { deskUrl } from './base'

export class ApiError extends Error {
	constructor(
		message: string,
		readonly endpoint: string,
		readonly status: number,
		readonly code: string | undefined,
	) {
		super(message)
		this.name = 'ApiError'
	}
}

// `error` is the sentence for a person, `code` the cause's name; `fix` is written for agents and never shown. A body that is not JSON leaves the status line as the message.
async function refusalOf(
	response: Response,
): Promise<{ message: string; code: string | undefined }> {
	const body: unknown = await response.json().catch(() => null)
	return {
		message:
			stringField(body, 'error') ??
			`${response.status} ${response.statusText}`,
		code: stringField(body, 'code'),
	}
}

function stringField(body: unknown, key: string): string | undefined {
	if (typeof body !== 'object' || body === null) return undefined
	const field: unknown = Reflect.get(body, key)
	if (typeof field !== 'string') return undefined
	return field
}

// Extra request headers ride as a plain record, merged over the JSON content type.
export type RequestOptions = Omit<RequestInit, 'headers'> & {
	headers?: Record<string, string>
}

// One listener for every refused request, so a page can react to a failure its callers each
// handle for themselves (the desk turns a relay failure into a notice, whichever action met it).
let onRefused: ((error: ApiError) => void) | null = null

export function observeRefusals(listener: (error: ApiError) => void): void {
	onRefused = listener
}

const request = async (
	url: string,
	endpoint: string,
	{ headers, ...opts }: RequestOptions,
): Promise<unknown> => {
	const response = await fetch(url, {
		...opts,
		headers: { 'content-type': 'application/json', ...headers },
	})
	if (!response.ok) {
		const refusal = await refusalOf(response)
		const error = new ApiError(
			refusal.message,
			endpoint,
			response.status,
			refusal.code,
		)
		onRefused?.(error)
		throw error
	}
	return response.json()
}

export const api = async (
	path: string,
	opts: RequestOptions = {},
): Promise<unknown> => request(deskUrl(path), path, opts)

export const hubApi = async (
	path: string,
	opts: RequestOptions = {},
): Promise<unknown> => request(path, path, opts)
