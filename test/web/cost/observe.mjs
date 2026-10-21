// What `wrangler dev` itself recorded about the Worker (its local Explorer: spans and logs in a
// SQLite the dev server serves over SQL, read-only): a Worker invocation is a root span, and a
// request an asset served never makes one, so the counts below are the local counterpart of the
// Analytics API's invocation count. Null answers everywhere when the dev server has no Explorer.
const QUERY = '/cdn-cgi/local/explorer/api/local/observability/query'
// The runtime's own entries: one per request (`"GET http://..."`) and one per event it runs, named
// by a bare word (`"jsrpc"`, `"hibernatableWebSocket"`). The Worker's code logs JSON.
const RUNTIME_LINE =
	/^"([A-Za-z]+|(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) https?:\/\/.*)"$/

const SETTLE_ROUNDS = 60
const SETTLE_STEP_MS = 1000
const API = '/cdn-cgi/local/explorer/api'

// What a deployed Worker has instead: nothing local to ask (the Analytics API is a person's read).
export const NO_EXPLORER = {
	isLocal: false,
	objectCount: async () => null,
	invocations: async () => null,
	settledInvocations: async () => null,
	baseline: async () => null,
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
		// Worker invocations so far: the root spans.
		async invocations() {
			const rows = await query(
				'SELECT count(*) AS n FROM spans WHERE parent_id IS NULL',
			)
			if (!rows) return null
			return rows[0].n
		},
		// Invocations once the store has caught up: the collector writes spans after the fact, and
		// behind a busy run it lags by seconds, so a read is taken when two a second apart agree.
		async settledInvocations() {
			let last = await this.invocations()
			for (
				let round = 0;
				round < SETTLE_ROUNDS && last !== null;
				round += 1
			) {
				await new Promise(resolve =>
					setTimeout(resolve, SETTLE_STEP_MS),
				)
				const now = await this.invocations()
				if (now === last) return now
				last = now
			}
			return last
		},
		// Empties the Explorer's store and answers the count it now holds (0), so a window's
		// invocations are read as a count since then: a difference of two reads over a long run
		// lost spans the store pruned. Null when it could not be emptied.
		async baseline() {
			try {
				const response = await fetch(
					new URL(`${API}/local/observability/clear`, origin),
					{
						method: 'POST',
					},
				)
				if (!response.ok) return null
			} catch {
				return null
			}
			return this.invocations()
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
		// runtime's own entries left out.
		async codeLogs(fromMs, toMs) {
			const rows = await query(
				`SELECT ts_ms, level, message FROM logs WHERE ts_ms >= ${Number(fromMs)} AND ts_ms <= ${Number(toMs)} ORDER BY ts_ms`,
			)
			if (!rows) return null
			return rows.filter(row => !RUNTIME_LINE.test(row.message))
		},
	}
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
