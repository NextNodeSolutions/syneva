import type { ApiError } from '@syneva/contracts/api'

export class ApiRequestError extends Error {
	readonly code: ApiError['code'] | null

	constructor(message: string, code: ApiError['code'] | null) {
		super(message)
		this.name = 'ApiRequestError'
		this.code = code
	}
}

export function isNotFound(error: unknown): boolean {
	return error instanceof ApiRequestError && error.code === 'not_found'
}
