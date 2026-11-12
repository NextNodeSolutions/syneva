import type { ApiError } from '@syneva/contracts/api'

export class SourceError extends Error {
	readonly code: ApiError['code']
	constructor(code: ApiError['code'], message: string) {
		super(message)
		this.name = 'SourceError'
		this.code = code
	}
}
