import { apiErrorSchema } from '@syneva/contracts/api'

import { ApiRequestError } from './api-request-error'

type Parser<Output> = { parse: (value: unknown) => Output }

export async function fetchJson<Output>(
	path: string,
	parser: Parser<Output>,
	signal: AbortSignal,
): Promise<Output> {
	const response = await fetch(path, {
		signal,
		headers: { accept: 'application/json' },
	})
	const body: unknown = await response.json().catch(() => null)
	if (!response.ok) throw failureOf(response, body)
	return parser.parse(body)
}

function failureOf(response: Response, body: unknown): ApiRequestError {
	const failure = apiErrorSchema.safeParse(body)
	if (failure.success)
		return new ApiRequestError(failure.data.error, failure.data.code)
	return new ApiRequestError(
		`The server answered ${response.status} ${response.statusText}.`,
		null,
	)
}
