// RFC 0001, 4.3's client policy, written from the RFC's table and not from either client's code
// (the probe's policy module, the frontend's transport, the contract's limits), so a drill holds
// what a client did against what it should have done. After every end a client read, it waits:
// - closed 1008: 30 s; 1013: 60 s; 4029, or HTTP 403, 429 or 503 on the upgrade: 5 min;
// - closed 4001, or HTTP 401 on the upgrade: no attempt ever again;
// - anything else (a deploy, a drop, the web unreachable): draw x min(60 s, 1 s x 2^k), full jitter,
//   `k` the backoff waits since the client's last socket opened (a named wait is no step of it),
//   `draw` the jitter the client took, which both clients record.
// Each wait is then judged three ways, each its own check: one attempt per wait (never two, never
// one no wait asked for), none sooner than the RFC's wait (the lower bound), none later than it
// plus SLACK_MS (the upper bound).
const SECOND_MS = 1000
const CLOSE_WAITS = new Map([
	[1008, { rule: '1008 rate: 30 s', ms: 30_000 }],
	[1013, { rule: '1013 too many: 60 s', ms: 60_000 }],
	[4029, { rule: '4029 saturated: 5 min', ms: 300_000 }],
])
const REFUSALS_WAITED = new Set([403, 429, 503])
const REFUSAL_WAIT_MS = 300_000
const REVOKED = 4001
const UNAUTHORIZED = 401
const BACKOFF_MIN_MS = 1000
const BACKOFF_MAX_MS = 60_000
// A wait drawn as 1234.6 ms may fire at 1234 ms: timers count whole milliseconds.
const TIMER_RESOLUTION_MS = 1
// How late an attempt may come after its wait: the event loop, a probe's fetch, the thread's post.
export const SLACK_MS = 3000

// What the RFC asks after `cause`, the end a client read: { rule, ms } (`ms` null for a stop, or
// for a backoff whose draw nobody recorded, which no bound can then be checked against).
export function rfcWait(cause, { step, draw }) {
	if (isStop(cause)) return { rule: 'stop', ms: null, isStop: true }
	const named = namedWait(cause)
	if (named) return named
	const ceiling = Math.min(BACKOFF_MAX_MS, BACKOFF_MIN_MS * 2 ** step)
	if (typeof draw !== 'number')
		return { rule: `backoff step ${step}, no draw recorded`, ms: null }
	return {
		rule: `backoff step ${step}: ${draw.toFixed(3)} x ${ceiling / SECOND_MS} s`,
		ms: draw * ceiling,
		step,
		isBackoff: true,
	}
}

function isStop(cause) {
	return (
		(cause.kind === 'closed' && cause.code === REVOKED) ||
		(cause.kind === 'refused' && cause.status === UNAUTHORIZED)
	)
}

function namedWait(cause) {
	if (cause.kind === 'closed') return CLOSE_WAITS.get(cause.code) ?? null
	if (cause.kind === 'refused' && REFUSALS_WAITED.has(cause.status))
		return { rule: `HTTP ${cause.status}: 5 min`, ms: REFUSAL_WAIT_MS }
	return null
}

// Every wait a client chose since `since`, with the RFC's wait for it and the attempt that followed
// (null while it still waits), and the strays: an attempt no wait asked for (but the client's
// first, its start), a wait no attempt followed before the next.
export function readTrace(client, since) {
	const waits = []
	const strays = []
	const first = client.trace.find(event => event.type === 'attempt')
	let step = 0
	let pending = null
	for (const event of client.trace.filter(each => each.at >= since)) {
		if (event.type === 'retry') {
			if (pending)
				strays.push(
					`${client.name}: a second wait with no attempt since the first`,
				)
			const expected = rfcWait(event.cause, { step, draw: event.draw })
			if (expected.isBackoff) step += 1
			pending = { client, decision: event, expected, attempt: null }
			waits.push(pending)
		} else {
			if (pending) pending.attempt = event
			else if (event !== first)
				strays.push(`${client.name}: an attempt no wait asked for`)
			pending = null
			if (event.outcome === 'open') step = 0
		}
	}
	return { waits, strays }
}

// The three checks over `clients`' traces since `since`; returns every wait read, for the drill's
// own checks (how deep the backoff went).
export function judgeWaits(report, clients, { since, origin = since }) {
	const now = Date.now()
	const read = clients.map(client => readTrace(client, since))
	const waits = read.flatMap(each => each.waits)
	const strays = read.flatMap(each => each.strays)
	report.check(
		'one attempt per wait: every attempt followed a wait of its own, every wait one attempt',
		waits.length > 0 && !strays.length,
		strays.length ? strays.join('; ') : 'no wait was read',
	)
	const early = waits.filter(wait => isEarly(wait))
	report.check(
		'lower bound: no attempt came sooner than RFC 4.3 says for the end before it (named waits; the backoff step k at its own draw)',
		waits.length > 0 && !early.length,
		early.map(wait => describe(wait, origin, now)).join('\n  '),
	)
	const late = waits.filter(wait => isLate(wait, now))
	report.check(
		`upper bound: none came more than ${SLACK_MS / SECOND_MS} s after it`,
		waits.length > 0 && !late.length,
		late.map(wait => describe(wait, origin, now)).join('\n  '),
	)
	return waits
}

function isEarly({ expected, decision, attempt }) {
	if (!attempt) return false
	if (expected.ms === null) return true
	return (
		attempt.at - decision.at + TIMER_RESOLUTION_MS < Math.floor(expected.ms)
	)
}

function isLate({ expected, decision, attempt }, now) {
	if (expected.isStop) return false
	if (expected.ms === null) return true
	const waited = (attempt?.at ?? now) - decision.at
	return waited > expected.ms + SLACK_MS
}

function describe({ client, decision, expected, attempt }, origin, now) {
	const waited = attempt
		? `${attempt.at - decision.at} ms`
		: `still waiting after ${now - decision.at} ms`
	const asked =
		expected.ms === null
			? expected.rule
			: `${expected.rule} = ${Math.round(expected.ms)} ms`
	return `${client.name} at ${seconds(decision.at - origin)} s after ${causeOf(decision.cause)}: the RFC asks ${asked}, it chose ${Math.round(decision.waitMs)} ms, waited ${waited}`
}

function causeOf(cause) {
	if (cause.kind === 'closed') return `a close ${cause.code}`
	if (cause.kind === 'refused') return `HTTP ${cause.status}`
	return cause.kind
}

// One client's story in words: each attempt (seconds from `origin`) and how it ended, each wait.
export function story(client, origin) {
	return `${client.name}: ${client.trace
		.filter(event => event.at >= origin)
		.map(event =>
			event.type === 'retry'
				? `wait ${Math.round(event.waitMs)} ms`
				: `${seconds(event.at - origin)}s ${event.outcome}`,
		)
		.join(', ')}`
}

const seconds = ms => (ms / SECOND_MS).toFixed(1)
