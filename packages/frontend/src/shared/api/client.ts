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

// What became of a desk request the hub answered, or the web for it: refused (its ApiError) or not
// (null), and when it was sent (performance.now()), which is when what it says held, however late
// the answer comes back.
export type DeskAnswer = { sentAt: number; refusal: ApiError | null }

type AnswerListener = (answer: DeskAnswer) => void

// One listener for every answered desk request (its routes reach the desk's own hub, relayed on
// the web), so a page can follow what its callers each handle for themselves: the desk keeps one
// notice of whether its hub can be reached, whichever action met what. A hub-level route may be
// the web's own (its health, its settings) and says nothing of the desk's hub: not followed.
let onDeskAnswer: AnswerListener | null = null

export function observeDeskAnswers(listener: AnswerListener): void {
	onDeskAnswer = listener
}

const request = async (
	url: string,
	endpoint: string,
	{ headers, ...opts }: RequestOptions,
	answered: AnswerListener | null,
): Promise<unknown> => {
	const sentAt = performance.now()
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
		answered?.({ sentAt, refusal: error })
		throw error
	}
	answered?.({ sentAt, refusal: null })
	return response.json()
}

export const api = async (
	path: string,
	opts: RequestOptions = {},
): Promise<unknown> => request(deskUrl(path), path, opts, onDeskAnswer)

export const hubApi = async (
	path: string,
	opts: RequestOptions = {},
): Promise<unknown> => request(path, path, opts, null)
