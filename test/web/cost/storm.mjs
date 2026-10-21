import { wsUrl } from './fakes/fake-hub.mjs'
// A reconnect storm: `perSecond` upgrade attempts a second for `seconds`, each answered or
// refused, every outcome kept with when it came. Attempts that open are closed at once.
import { delay } from './fakes/timing.mjs'
import { WebSocket } from './fakes/ws.mjs'

const MS_PER_S = 1000
const TICK_MS = 5
const OPENED = 101

export async function storm({ origin, route, headers, perSecond, seconds }) {
	const startedAt = Date.now()
	const outcomes = []
	const pending = []
	let started = 0
	const total = perSecond * seconds
	while (started < total) {
		const due = Math.min(
			total,
			Math.floor(((Date.now() - startedAt) / MS_PER_S) * perSecond) + 1,
		)
		for (; started < due; started += 1)
			pending.push(
				attempt({ origin, route, headers }, startedAt, outcomes),
			)
		await delay(TICK_MS)
	}
	await Promise.all(pending)
	return { startedAt, endedAt: Date.now(), outcomes, attempts: total }
}

function attempt({ origin, route, headers }, startedAt, outcomes) {
	return new Promise(resolve => {
		const socket = new WebSocket(wsUrl(origin, route), { headers })
		const done = status => {
			outcomes.push({ status, at: Date.now() - startedAt })
			resolve()
		}
		socket.once('open', () => {
			socket.terminate()
			done(OPENED)
		})
		socket.once('unexpected-response', (_request, response) => {
			response.resume()
			done(response.statusCode)
		})
		socket.once('error', () => {
			done('error')
		})
	})
}

// { status: count } over the outcomes.
export function histogram(outcomes) {
	const counts = {}
	for (const { status } of outcomes)
		counts[status] = (counts[status] ?? 0) + 1
	return counts
}

export const describe = counts =>
	Object.entries(counts)
		.map(([status, count]) => `${status} x${count}`)
		.join(', ')
