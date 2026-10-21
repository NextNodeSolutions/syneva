// One request as every route of the Worker reads it: the request, its URL, the env, the
// execution context, and the time it arrived (one clock per request, so a row's timestamps agree).
export type Call = {
	readonly request: Request
	readonly url: URL
	readonly env: Env
	readonly ctx: ExecutionContext
	readonly now: Date
}

// A route answers its request, or passes (null) to the next in the Worker's order.
export type Route = (call: Call) => Promise<Response | null>

export function isRead(request: Request): boolean {
	return request.method === 'GET' || request.method === 'HEAD'
}

export function iso(date: Date): string {
	return date.toISOString()
}

const MS_PER_SECOND = 1000

export function secondsAfter(date: Date, seconds: number): Date {
	return new Date(date.getTime() + seconds * MS_PER_SECOND)
}
