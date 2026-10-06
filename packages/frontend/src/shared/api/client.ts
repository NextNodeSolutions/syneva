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

const request = async (
	url: string,
	endpoint: string,
	opts: RequestInit,
): Promise<unknown> => {
	const response = await fetch(url, {
		headers: { 'content-type': 'application/json' },
		...opts,
	})
	if (!response.ok) {
		const refusal = await refusalOf(response)
		throw new ApiError(
			refusal.message,
			endpoint,
			response.status,
			refusal.code,
		)
	}
	return response.json()
}

export const api = async (
	path: string,
	opts: RequestInit = {},
): Promise<unknown> => request(deskUrl(path), path, opts)

export const hubApi = async (
	path: string,
	opts: RequestInit = {},
): Promise<unknown> => request(path, path, opts)
