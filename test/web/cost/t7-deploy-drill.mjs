// T7 deploy drill (RFC 0001, 6.7; guards 6.1 B4, G1): a no-op deploy drops every socket; every
// client must be back within 60 s, with one attempt per backoff step. The clients are five tabs
// through the frontend's own transport and a hub through the probe's policy module (fleet.mjs),
// and every attempt and wait they make is held against RFC 4.3's ladder (rfc-waits.mjs): the k-th
// wait after the drop is the client's draw x min(60 s, 1 s x 2^k), no sooner (a client that skips
// the exponent, or retries at once, fails) and no later. On a deployed Worker you deploy while it
// watches; locally `--restart` restarts `wrangler dev` under it, which drops the sockets the same
// way, and keeps it down long enough for every client to climb the ladder.
import { delay } from './fakes/timing.mjs'
import { fleetOf, isSettled, until } from './fleet.mjs'
import { iso } from './hold.mjs'
import { judgeWaits, story } from './rfc-waits.mjs'

const TABS = 5
const BACK_WITHIN_MS = 60_000
const STABLE_MS = 15_000
const UP_WITHIN_MS = 60_000
// The ladder is exercised once a client took its third step (k = 2, up to 4 s): below that a client
// that skips the exponent waits as long as one that does. Steps 0 and 1 last 3 s at most, so a
// local outage of 4 s takes every client there; a longer one would let a client that drew short
// waits climb to a 60 s step and miss the 60 s it has to be back in. A deploy's outage is what it
// is.
const DEEPEST_STEP = 2
const OUTAGE_MS = 4000
const MS_PER_S = 1000

async function run(ctx) {
	const { report } = ctx
	const account = await ctx.account(0)
	const clients = await fleetOf(ctx, account, { tabs: TABS })
	for (const client of clients) client.start()
	try {
		await until(() => isSettled(clients), UP_WITHIN_MS)
		report.check(
			`${TABS} tabs (the frontend's transport) and a hub are connected before the deploy, every tab past the hub's hello`,
			isSettled(clients),
			clients.map(client => `${client.name}:${client.isOpen}`).join(' '),
		)
		const droppedAt = await dropThem(ctx, clients)
		await until(
			() => clients.every(client => isBackSince(client, droppedAt)),
			minutesOf(ctx) * 60_000,
		)
		await delay(STABLE_MS)
		judge(ctx, clients, droppedAt)
	} finally {
		for (const client of clients) await client.stop()
	}
	ctx.printReads('T7', { from: null, to: null })
}

const minutesOf = ctx => Number(ctx.options.minutes ?? 10)

const isBackSince = (client, since) => client.opens.some(at => at > since)

// Locally: restart `wrangler dev`. On a deployed Worker: the person deploys, we wait for the drop.
async function dropThem(ctx, clients) {
	if (!ctx.staging) {
		const startedAt = Date.now()
		await ctx.web.restart({ downMs: OUTAGE_MS })
		ctx.note(
			`wrangler dev was down ${((Date.now() - startedAt) / MS_PER_S).toFixed(1)} s (stopped, ${OUTAGE_MS / MS_PER_S} s, started)`,
		)
		return startedAt
	}
	ctx.note(
		`DEPLOY NOW: ship a no-op change of the staging Worker (the clients are watching since ${iso(Date.now())})`,
	)
	await until(
		() => clients.every(client => client.drops.length > 0),
		minutesOf(ctx) * 60_000,
	)
	return Math.min(
		...clients.flatMap(client => client.drops.map(drop => drop.at)),
	)
}

function judge(ctx, clients, droppedAt) {
	const { report } = ctx
	const stories = clients.map(client => story(client, droppedAt))
	const dropped = clients.filter(client => client.drops.length > 0)
	report.check(
		'every socket was dropped by the deploy',
		dropped.length === clients.length,
		`${dropped.length} of ${clients.length}`,
	)
	const back = clients.map(client => client.opens.find(at => at > droppedAt))
	const slowest = Math.max(...back.map(at => (at ?? Infinity) - droppedAt))
	report.check(
		`every client reconnected within ${BACK_WITHIN_MS / MS_PER_S} s of the drop (slowest ${Number.isFinite(slowest) ? (slowest / MS_PER_S).toFixed(1) : 'never'} s)`,
		slowest <= BACK_WITHIN_MS,
		stories.join('\n  '),
	)
	const waits = judgeWaits(report, clients, { since: droppedAt })
	report.check(
		'... and every wait after the drop was a backoff step (a deploy names no wait)',
		waits.length > 0 && waits.every(wait => wait.expected.isBackoff),
		stories.join('\n  '),
	)
	const deepest = clients.map(client => ({
		client,
		step: Math.max(
			-1,
			...waits
				.filter(wait => wait.client === client)
				.map(wait => wait.expected.step ?? -1),
		),
	}))
	const steps = deepest
		.map(({ client, step }) => `${client.name}:${step}`)
		.join(' ')
	if (ctx.staging)
		ctx.note(
			`the deploy took the clients to backoff step ${steps} (from k = ${DEEPEST_STEP} the ladder tells an exponent from a flat wait)`,
		)
	else
		report.check(
			`... and the outage took every client to backoff step ${DEEPEST_STEP} or deeper, so the lower bound held the exponent`,
			deepest.every(({ step }) => step >= DEEPEST_STEP),
			steps,
		)
	report.check(
		`... and none dropped again in the ${STABLE_MS / MS_PER_S} s after it was back`,
		clients.every(client => client.drops.length === 1),
		clients
			.map(client => `${client.name}:${client.drops.length}`)
			.join(' '),
	)
}

export const t7 = {
	id: 'T7',
	title: 'deploy drill',
	where: 'staging',
	run,
	dryRun: run,
	dryRunNeeds: 'restart',
	skipHint: 'pass --restart to drill it against a wrangler dev restart',
}
