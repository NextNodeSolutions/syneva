// T10 breaker drill, edge stage (RFC 0001, 6.5 and 6.7): a WAF custom rule blocks every request to
// the app hostname but /bridge/v1/ops/*, created and deleted through the Cloudflare API. Clients
// get 403 on their upgrade and must wait five minutes; the Worker's invocation count stops moving;
// deleted, everyone is back within the backoff window. Only a deployed zone has an edge, so on
// staging this is a person's procedure with a client-side trace: five tabs through the frontend's
// own transport and a hub through the probe's policy module (fleet.mjs) are dropped once the rule
// is up, and every attempt and wait they make is written down and held against RFC 4.3
// (rfc-waits.mjs). `--edge` drills the same clients locally behind an edge stand-in (edge.mjs)
// whose rule answers 403, 429 or 503 by tab, the three refusals 4.3 waits five minutes on.
// `--procedures` prints the staging steps without running them.
import { startEdge } from './edge.mjs'
import { delay } from './fakes/timing.mjs'
import { fleetOf, isBrowserTab, isSettled, until } from './fleet.mjs'
import { iso } from './hold.mjs'
import { judgeWaits, story } from './rfc-waits.mjs'
import { EDGE_STAGE_STEPS } from './staging-reads.mjs'

const TABS = 5
const FIVE_MINUTES_MS = 300_000
// A five-minute wait may fire a millisecond early: timers count whole milliseconds.
const TIMER_RESOLUTION_MS = 1
const UP_WITHIN_MS = 60_000
const BACK_WITHIN_MS = FIVE_MINUTES_MS + 60_000
const MS_PER_S = 1000
const MS_PER_MINUTE = 60_000
// The WAF rule's answer on staging (RFC 6.5): the edge says 403 to every request it blocks.
const WAF_STATUS = 403
// The stand-in's answers by tab, the hub (which sends no label) getting the WAF's.
const STAND_IN_STATUSES = [403, 429, 503]
// Long enough for a second refusal: the drop's backoff step, then one five-minute wait.
const LOCAL_MINUTES = 5.5
const STAGING_MINUTES = 11

async function run(ctx) {
	const { host } = new URL(ctx.web.origin)
	process.stdout.write(
		`\nprocedure (a person's):\n${EDGE_STAGE_STEPS(host)
			.map(line => `  ${line}`)
			.join('\n')}\n\n`,
	)
	await drill(ctx, {
		origin: ctx.web.origin,
		statusOf: () => WAF_STATUS,
		raise: () =>
			ctx.prompt(
				'Do steps 1 to 3 now (the rule is up and the edge answers 403). Press Enter and the sockets are dropped',
			),
		lower: () =>
			ctx.prompt(
				'Do step 4 now (delete the rule). Press Enter when it is gone',
			),
		minutes: Number(ctx.options.minutes ?? STAGING_MINUTES),
	})
	ctx.printReads('T10', { from: null, to: iso(Date.now()) })
}

async function dryRun(ctx) {
	const edge = await startEdge({
		port: Number(ctx.options['edge-port']),
		target: ctx.web.origin,
	})
	ctx.note(
		`the clients reach the web through an edge stand-in at ${edge.origin}`,
	)
	try {
		await drill(ctx, {
			origin: edge.origin,
			statusOf: standInStatus,
			raise: () => {
				edge.block(standInStatus)
			},
			lower: () => {
				edge.unblock()
			},
			minutes: Number(ctx.options.minutes ?? LOCAL_MINUTES),
		})
	} finally {
		await edge.stop()
	}
}

// Tab n gets the n-th of 403, 429, 503 in turn; the hub, which names itself to no edge, 403.
function standInStatus(label) {
	const tab = /^tab (\d+)$/.exec(label ?? '')
	return tab
		? STAND_IN_STATUSES[Number(tab[1]) % STAND_IN_STATUSES.length]
		: WAF_STATUS
}

// What the rule answers `client`: a tab names itself to the edge (its page's label), a hub does not.
const statusFor = (client, statusOf) =>
	statusOf(isBrowserTab(client) ? client.name : null)

async function drill(ctx, { origin, statusOf, raise, lower, minutes }) {
	const { report } = ctx
	const account = await ctx.account(0)
	const clients = await fleetOf(ctx, account, { tabs: TABS, origin })
	for (const client of clients) client.start()
	try {
		await until(() => isSettled(clients), UP_WITHIN_MS)
		report.check(
			`${TABS} tabs (the frontend's transport) and a hub are connected`,
			isSettled(clients),
			clients.map(client => `${client.name}:${client.isOpen}`).join(' '),
		)
		await raise()
		const droppedAt = Date.now()
		for (const client of clients) client.drop()
		await delay(minutes * MS_PER_MINUTE)
		judgeRefusals(ctx, clients, {
			droppedAt,
			until: Date.now(),
			expected: client => statusFor(client, statusOf),
		})
		await lower()
		const deletedAt = Date.now()
		await until(
			() => clients.every(client => isBackSince(client, deletedAt)),
			BACK_WITHIN_MS,
		)
		judgeReturn(ctx, clients, deletedAt)
		judgeWaits(report, clients, { since: droppedAt })
	} finally {
		for (const client of clients) await client.stop()
	}
}

const isBackSince = (client, since) => client.opens.some(at => at > since)

// While the rule was up: every attempt refused with the rule's answer, five minutes or more apart.
export function judgeRefusals(
	{ report },
	clients,
	{ droppedAt, until: windowEnd, expected },
) {
	const windowMs = windowEnd - droppedAt
	const during = client =>
		client.attempts.filter(
			each => each.at >= droppedAt && each.at < windowEnd,
		)
	const stories = clients.map(client => story(client, droppedAt)).join('\n  ')
	report.check(
		"every attempt while the rule was up was refused with the rule's answer (as the client read it), none opened",
		clients.every(client => {
			const attempts = during(client)
			return (
				attempts.length > 0 &&
				attempts.every(each => each.outcome === expected(client))
			)
		}),
		`${clients.map(client => `${client.name} expects ${expected(client)}`).join(', ')}\n  ${stories}`,
	)
	report.check(
		'... and each client tried at least twice (its first refusal, then one five-minute wait seen out)',
		clients.every(client => during(client).length >= 2),
		stories,
	)
	const isSpaced = client =>
		during(client).every(
			(each, at, attempts) =>
				at === 0 ||
				each.at - attempts[at - 1].at + TIMER_RESOLUTION_MS >=
					FIVE_MINUTES_MS,
		)
	report.check(
		'... and no client tried again within five minutes of its last attempt',
		clients.every(isSpaced),
		stories,
	)
	// The first attempt can come right after the drop, each next one five minutes after the last.
	const most =
		1 + Math.floor(windowMs / (FIVE_MINUTES_MS - TIMER_RESOLUTION_MS))
	report.check(
		`... so at most ${most} attempts per client in ${(windowMs / MS_PER_MINUTE).toFixed(1)} min`,
		clients.every(client => during(client).length <= most),
		clients
			.map(client => `${client.name}:${during(client).length}`)
			.join(' '),
	)
}

// The rule gone: every client is back before its next five-minute wait ends.
function judgeReturn({ report }, clients, deletedAt) {
	const back = clients.map(client => client.opens.find(at => at > deletedAt))
	const slowest = Math.max(...back.map(at => (at ?? Infinity) - deletedAt))
	report.check(
		`the rule deleted, every client is back within the backoff window (${BACK_WITHIN_MS / MS_PER_S} s; slowest ${Number.isFinite(slowest) ? (slowest / MS_PER_S).toFixed(0) : 'never'} s)`,
		slowest <= BACK_WITHIN_MS,
		clients.map(client => story(client, deletedAt)).join('\n  '),
	)
}

// The app hostname the rule names: the staging origin's, or a placeholder off staging.
function hostOf(ctx) {
	return ctx.staging ? new URL(ctx.web.origin).host : '<staging app hostname>'
}

export const t10 = {
	id: 'T10',
	title: 'breaker drill, edge stage',
	where: 'staging',
	run,
	dryRun,
	dryRunNeeds: 'edge',
	procedure: ctx => {
		process.stdout.write(
			`${EDGE_STAGE_STEPS(hostOf(ctx))
				.map(line => `  ${line}`)
				.join('\n')}\n`,
		)
		ctx.printReads('T10', {})
	},
	skipHint:
		'a WAF rule needs a deployed zone; --edge drills its clients behind a local edge stand-in, --procedures prints the steps',
}
