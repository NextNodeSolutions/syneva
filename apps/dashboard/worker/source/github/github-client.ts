import { SourceError } from '../source-error'

import type { ApiError } from '@syneva/contracts/api'

const API_ORIGIN = 'https://api.github.com'
const PAGE_SIZE = 100
const REQUEST_TIMEOUT_MS = 20_000
const API_VERSION = '2022-11-28'
const HTTP_FAILURES: Readonly<Record<number, ApiError>> = {
	401: {
		code: 'github_reconnect',
		error: 'Reconnect GitHub in Settings to renew repository access.',
	},
	403: {
		code: 'forbidden',
		error: 'GitHub denied access. Check repository access and app permissions in Settings.',
	},
	404: {
		code: 'not_found',
		error: 'This repository or pull request is no longer accessible.',
	},
	429: {
		code: 'github_rate_limited',
		error: 'GitHub has limited requests. Wait before refreshing.',
	},
}
const RATE_LIMITED = 429

type Parser<Output> = { parse: (value: unknown) => Output }
export type GithubClient = {
	json: <Output>(path: string, parser: Parser<Output>) => Promise<Output>
	pages: <Output>(path: string, parser: Parser<Output[]>) => Promise<Output[]>
}

export function createGithubClient(token: string): GithubClient {
	async function request(path: string): Promise<Response> {
		try {
			const response = await fetch(`${API_ORIGIN}${path}`, {
				headers: {
					accept: 'application/vnd.github+json',
					authorization: `Bearer ${token}`,
					'user-agent': 'Syneva',
					'x-github-api-version': API_VERSION,
				},
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
				redirect: 'manual',
			})
			if (response.ok) return response
			await response.body?.cancel()
			throw responseFailure(response)
		} catch (error) {
			if (error instanceof SourceError) throw error
			throw new SourceError(
				'github_unavailable',
				'GitHub could not be reached. Retry in a moment.',
			)
		}
	}
	async function json<Output>(
		path: string,
		parser: Parser<Output>,
	): Promise<Output> {
		return parseResponse(await request(path), parser)
	}
	async function loadPage<Output>(
		path: string,
		parser: Parser<Output[]>,
		page: number,
	): Promise<Output[]> {
		const separator = path.includes('?') ? '&' : '?'
		const response = await request(
			`${path}${separator}per_page=${PAGE_SIZE}&page=${page}`,
		)
		const entries = await parseResponse(response, parser)
		if (!response.headers.get('link')?.includes('rel="next"'))
			return entries
		return [...entries, ...(await loadPage(path, parser, page + 1))]
	}
	return { json, pages: (path, parser) => loadPage(path, parser, 1) }
}

async function parseResponse<Output>(
	response: Response,
	parser: Parser<Output>,
): Promise<Output> {
	try {
		return parser.parse(await response.json())
	} catch {
		throw new SourceError(
			'github_unavailable',
			'GitHub returned an unexpected response. Retry in a moment.',
		)
	}
}

function responseFailure(response: Response): SourceError {
	const status =
		response.headers.get('x-ratelimit-remaining') === '0'
			? RATE_LIMITED
			: response.status
	const failure = HTTP_FAILURES[status] ?? {
		code: 'github_unavailable',
		error: 'GitHub is unavailable. Retry in a moment.',
	}
	return new SourceError(failure.code, failure.error)
}
