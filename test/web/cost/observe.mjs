// What `wrangler dev` itself recorded about the Worker (its local Explorer: spans and logs in a
// SQLite the dev server serves over SQL, read-only): the runtime writes one request line per Worker
// invocation, and a request an asset served never makes one, so the counts below are the local
// counterpart of the Analytics API's invocation count. Every count is of the invocations that
// started inside a window: an upgrade's invocation is recorded when its socket ends, which can be
// long after, inside a later test's window. A null is a reading not taken (no Explorer answered):
// the test names it as not measured, never as an `ok`.
const QUERY = '/cdn-cgi/local/explorer/api/local/observability/query'
// The runtime's own entries: one per request (`"GET http://..."`) and one per event it runs, named
// by a bare word (`"jsrpc"`, `"hibernatableWebSocket"`). The Worker's code logs JSON.
const RUNTIME_LINE =
	/^"([A-Za-z]+|(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) https?:\/\/.*)"$/
const REQUEST_LINE = /^"([A-Z]+) (https?:\/\/[^"]+)"$/

const SETTLE_ROUNDS = 50
const SETTLE_STEP_MS = 200
const API = '/cdn-cgi/local/explorer/api'

// What a deployed Worker has instead: nothing local to ask (the Analytics API is a person's read).
export const NO_EXPLORER = {
	isLocal: false,
	objectCount: async () => null,
	requests: async () => null,
	settledRequests: async () => null,
	objectEvents: async () => null,
	codeLogs: async () => null,
}

export function createExplorer(origin) {
	const query = async sql => {
		try {
			const response = await fetch(new URL(QUERY, origin), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ sql }),
			})
			if (!response.ok) return null
			const { result } = await response.json()
			const { columns, rows } = result
			return rows.map(row =>
				Object.fromEntries(columns.map((name, at) => [name, row[at]])),
			)
		} catch {
			return null
		}
	}
	const get = async route => {
		try {
			const response = await fetch(new URL(`${API}${route}`, origin))
			if (!response.ok) return null
			return await response.json()
		} catch {
			return null
		}
	}
	return {
		isLocal: true,
		// How many Durable Objects exist (each person's is created by its first request).
		async objectCount() {
			const spaces = await get('/workers/durable_objects/namespaces')
			const id = spaces?.result?.[0]?.id
			if (!id) return null
			const objects = await get(
				`/workers/durable_objects/namespaces/${id}/objects`,
			)
			return objects?.result?.length ?? null
		},
		// The Worker's invocations that started between two times (epoch ms), counted per path: a
		// path that ran it once per load, or not at all. The sub-invocations it makes of its own
		// object (`https://user-hub.internal/...`) are the object's, not requests to the Worker.
		async requests(fromMs, toMs) {
			const rows = await query(
				`SELECT message, count(*) AS n FROM logs WHERE ts_ms >= ${Number(fromMs)} AND ts_ms <= ${Number(toMs)} GROUP BY message`,
			)
			if (!rows) return null
			const { host } = new URL(origin)
			const counts = new Map()
			for (const { message, n } of rows) {
				const [, method, url] = REQUEST_LINE.exec(message) ?? []
				if (!url || new URL(url).host !== host) continue
				const key = `${method} ${new URL(url).pathname}`
				counts.set(key, (counts.get(key) ?? 0) + n)
			}
			return counts
		},
		// `requests` once the store has caught up: the collector writes an invocation after it
		// ends, and behind a busy run it lags, so a read is taken when two in a row agree.
		async settledRequests(fromMs, toMs) {
			let last = await this.requests(fromMs, toMs)
			for (
				let round = 0;
				round < SETTLE_ROUNDS && last !== null;
				round += 1
			) {
				await new Promise(resolve =>
					setTimeout(resolve, SETTLE_STEP_MS),
				)
				const now = await this.requests(fromMs, toMs)
				if (
					now !== null &&
					invocationTotal(now) === invocationTotal(last)
				)
					return now
				last = now
			}
			return last
		},
		// The Durable Object events the runtime ran between two times (epoch ms): a hibernatable
		// socket's message, close or error wakes the object and logs `hibernatableWebSocket`; the
		// runtime's auto-response to a ping runs no code and logs nothing.
		async objectEvents(fromMs, toMs) {
			const rows = await query(
				`SELECT ts_ms, message FROM logs WHERE ts_ms >= ${Number(fromMs)} AND ts_ms <= ${Number(toMs)} AND message LIKE '%hibernatableWebSocket%'`,
			)
			return rows
		},
		// The log lines the Worker's code wrote between two times (epoch ms), the runtime's own
		// entries left out.
		async codeLogs(fromMs, toMs) {
			const rows = await query(
				`SELECT ts_ms, level, message FROM logs WHERE ts_ms >= ${Number(fromMs)} AND ts_ms <= ${Number(toMs)} ORDER BY ts_ms`,
			)
			if (!rows) return null
			return rows.filter(row => !RUNTIME_LINE.test(row.message))
		},
	}
}

// A `requests` read in words: `GET /path x3, ...`.
export const describeRequests = counts =>
	[...counts.entries()].map(([key, count]) => `${key} x${count}`).join(', ')

// How many invocations a `requests` read holds in all.
export function invocationTotal(counts) {
	let sum = 0
	for (const count of counts.values()) sum += count
	return sum
}

// Text `wrangler dev` printed on stdout/stderr between two offsets, minus its own request lines
// (`[wrangler:info] GET /path 200 OK`) and its banner: what is left is the Worker's `console`.
export function stdoutLogs(web, from, to) {
	return web.output.text
		.slice(from, to)
		.split('\n')
		.filter(line => line.trim() && !isWranglerOwn(line))
}

const WRANGLER_OWN =
	/^\s*(\[wrangler:|⎔|⛅|─|Your Worker|Binding|env\.|Wrangler|The Local|Useful|\s*(GET|POST|PUT|PATCH|DELETE)\s+http)/

function isWranglerOwn(line) {
	return WRANGLER_OWN.test(line)
}
