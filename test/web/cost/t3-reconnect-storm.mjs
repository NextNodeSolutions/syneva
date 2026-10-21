// T3 reconnect storm (RFC 0001, 6.7; guards R9, R10, 6.1 B3, B5): 100 connects a second from one
// address for a minute. On a deployed Worker the edge's rate limiting rule answers 429 within ten
// seconds and the Worker's request count for the minute stays under 1,000 (an Analytics read).
// Locally there is no edge, so the dry run checks what the Worker does by itself: a socket
// upgrade with no good credential is a 401 before any object is touched, and a known hub that
// reconnects in a loop is held to RL_AUTH's ten a minute.
import { BRIDGE_PATHS } from '../../../packages/contracts/dist/bridge.js'

import { delay } from './fakes/timing.mjs'
import { iso } from './hold.mjs'
import { invocationTotal } from './observe.mjs'
import { describe, histogram, storm } from './storm.mjs'

const PER_SECOND = 100
const EDGE_WITHIN_S = 10
const WORKER_REQUESTS_MAX = 1000
const HTTP_UNAUTHORIZED = 401
const HTTP_OPENED = 101
const HTTP_TOO_MANY = 429
const LOOP_ATTEMPTS = 30
const RL_PER_MINUTE = 10
const SETTLE_MS = 500
const BAD_TOKEN = 'cost-test-token-that-opens-no-hub'

// Staging: the storm itself, from this machine's address.
async function run(ctx) {
	const { report, options } = ctx
	const seconds = Number(options.seconds ?? 60)
	ctx.note(
		`${PER_SECOND} upgrade attempts a second for ${seconds} s at ${BRIDGE_PATHS.hubSocket}, a token that opens no hub`,
	)
	const stormed = await storm({
		origin: ctx.web.origin,
		route: BRIDGE_PATHS.hubSocket,
		headers: { authorization: `Bearer ${BAD_TOKEN}` },
		perSecond: PER_SECOND,
		seconds,
	})
	const counts = histogram(stormed.outcomes)
	ctx.note(`outcomes: ${describe(counts)}`)
	const edge = stormed.outcomes.filter(
		each => each.status === HTTP_TOO_MANY || each.status === 403,
	)
	const first = edge.length
		? Math.min(...edge.map(each => each.at)) / 1000
		: null
	report.check(
		`the edge answers 429 (or 403) within ${EDGE_WITHIN_S} s`,
		first !== null && first <= EDGE_WITHIN_S,
		first === null ? 'never' : `first at ${first.toFixed(1)} s`,
	)
	const reached = counts[HTTP_UNAUTHORIZED] ?? 0
	report.check(
		`attempts that reached the Worker (401) stay under ${WORKER_REQUESTS_MAX} for the minute`,
		reached < WORKER_REQUESTS_MAX,
		`${reached} of ${stormed.attempts}`,
	)
	report.check(
		'nothing opened and nothing failed with a 5xx',
		!counts[HTTP_OPENED] &&
			!Object.keys(counts).some(status => status.startsWith('5')),
		describe(counts),
	)
	ctx.printReads('T3', {
		from: iso(stormed.startedAt),
		to: iso(stormed.endedAt),
	})
}

async function dryRun(ctx) {
	const { report, ops } = ctx
	const account = await ctx.account(0)
	const tab = await ctx.tab(account)
	await settled(tab)
	const before = await ops.status()
	const since = Date.now()
	const framesBefore = tab.frames.length
	const objectsBefore = await ctx.explorer.objectCount()
	const hubs = await storm({
		origin: ctx.web.origin,
		route: BRIDGE_PATHS.hubSocket,
		headers: { authorization: `Bearer ${BAD_TOKEN}` },
		perSecond: PER_SECOND,
		seconds: 1,
	})
	const tabs = await storm({
		origin: ctx.web.origin,
		route: BRIDGE_PATHS.tabSocket,
		headers: { origin: ctx.web.origin },
		perSecond: PER_SECOND,
		seconds: 1,
	})
	const until = Date.now()
	report.check(
		`${hubs.attempts} hub upgrades in a second with a bad token: every answer is 401`,
		describe(histogram(hubs.outcomes)) === `401 x${hubs.attempts}`,
		describe(histogram(hubs.outcomes)),
	)
	report.check(
		`${tabs.attempts} tab upgrades in a second with no session: every answer is 401`,
		describe(histogram(tabs.outcomes)) === `401 x${tabs.attempts}`,
		describe(histogram(tabs.outcomes)),
	)
	await noObjectTouched(ctx, {
		tab,
		before,
		framesBefore,
		since,
		until,
		objectsBefore,
		storms: [hubs, tabs],
	})
	await knownHubLoop(ctx)
}

// Nothing the storm did reached an object: the person's tab heard nothing, the ops status is the
// same, the Worker logged nothing.
async function noObjectTouched(ctx, seen) {
	const { report, ops } = ctx
	const { tab, before, framesBefore, since, until, objectsBefore, storms } =
		seen
	const after = await ops.status()
	report.check(
		'no object was created or woken: the ops status is unchanged (users, hubs seen)',
		after.body.users === before.body.users &&
			after.body.hubsSeenLastDay === before.body.hubsSeenLastDay,
		`${JSON.stringify(before.body)} -> ${JSON.stringify(after.body)}`,
	)
	report.check(
		"... the person's open tab read no new frame (no `hub` frame from a stranger)",
		tab.isOpen && tab.frames.length === framesBefore,
		`${tab.frames.length - framesBefore} new frames`,
	)
	const objectsAfter = await ctx.explorer.objectCount()
	if (objectsBefore !== null && objectsAfter !== null)
		report.check(
			'... and the Durable Objects that exist are the same (the storm created none)',
			objectsAfter === objectsBefore,
			`${objectsBefore} -> ${objectsAfter}`,
		)
	const requests = await ctx.explorer.settledRequests(since, until)
	if (requests !== null)
		ctx.note(
			`the Worker ran ${invocationTotal(requests)} times for ${storms.reduce((sum, each) => sum + each.attempts, 0)} attempts (each refused after at most one D1 read, before any object)`,
		)
	const logged = await ctx.explorer.codeLogs(since, until)
	if (logged)
		report.check(
			'... and the Worker wrote no log line for it (T8: the storm minute produces none)',
			!logged.length,
			logged
				.slice(0, 3)
				.map(row => row.message)
				.join(' | '),
		)
}

// A hub that is known reconnects in a loop: RL_AUTH lets ten attempts a minute through.
async function knownHubLoop(ctx) {
	const { report, options } = ctx
	if (!(options.cookie.length > 1) && ctx.staging) return
	const account = await ctx.account(1)
	const hub = await ctx.hub(account, 0)
	const outcomes = []
	for (let at = 0; at < LOOP_ATTEMPTS; at += 1) {
		const { outcome } = await hub.attempt({ answerSnapshots: false })
		outcomes.push(outcome === 'open' ? HTTP_OPENED : outcome)
		hub.terminate()
	}
	const counts = histogram(outcomes.map(status => ({ status })))
	report.check(
		`a known hub reconnecting ${LOOP_ATTEMPTS} times in a loop opens at most ${RL_PER_MINUTE} times, the rest are 429`,
		(counts[HTTP_OPENED] ?? 0) <= RL_PER_MINUTE &&
			(counts[HTTP_OPENED] ?? 0) >= 1 &&
			(counts[HTTP_TOO_MANY] ?? 0) >= LOOP_ATTEMPTS - RL_PER_MINUTE,
		describe(counts),
	)
}

// The tab's first frames (a `hub` frame per paired hub) have come.
async function settled(tab) {
	await delay(SETTLE_MS)
	return tab
}

export const t3 = {
	id: 'T3',
	title: 'reconnect storm',
	where: 'staging',
	run,
	dryRun,
}
