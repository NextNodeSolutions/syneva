// T7 deploy drill (RFC 0001, 6.7; guards 6.1 B4, G1): a no-op deploy drops every socket; every
// client must be back within 60 s, none with more than one attempt per backoff step. The clients
// here keep their sockets the way the probe and the frontend do (the probe's own policy module),
// five tabs and a hub, and write down every attempt. On a deployed Worker you deploy while it
// watches; locally `--restart` restarts `wrangler dev` under it, which drops the sockets the
// same way.
import { PolicyClient, story } from './fakes/policy-client.mjs'
import { delay } from './fakes/timing.mjs'
import { iso } from './hold.mjs'

const TABS = 5
const BACK_WITHIN_MS = 60_000
const MAX_ATTEMPTS = 8
const SLACK_MS = 3000
const STABLE_MS = 15_000
const POLL_MS = 500
const UP_WITHIN_MS = 60_000
const MS_PER_S = 1000

async function run(ctx) {
	const { report, options } = ctx
	const account = await ctx.account(0)
	const hub = await ctx.hub(account, 0)
	const clients = [new PolicyClient({ name: 'hub', peer: hub })]
	for (let at = 0; at < TABS; at += 1)
		clients.push(
			new PolicyClient({
				name: `tab ${at}`,
				peer: await ctx.tab(account, { connect: false }),
			}),
		)
	for (const client of clients) client.start()
	try {
		await until(() => clients.every(client => client.isOpen), UP_WITHIN_MS)
		report.check(
			`${TABS} tabs and a hub are connected before the deploy`,
			clients.every(client => client.isOpen),
			clients.map(client => `${client.name}:${client.isOpen}`).join(' '),
		)
		const droppedAt = await dropThem(ctx, clients)
		const waitMs = Number(options.minutes ?? 10) * 60_000
		await until(
			() => clients.every(client => client.opens.length > 1),
			waitMs,
		)
		await delay(STABLE_MS)
		judge(ctx, clients, droppedAt)
	} finally {
		for (const client of clients) await client.stop()
	}
	ctx.printReads('T7', { from: null, to: null })
}

// Locally: restart `wrangler dev`. On a deployed Worker: the person deploys, we wait for the drop.
async function dropThem(ctx, clients) {
	if (!ctx.staging) {
		const startedAt = Date.now()
		await ctx.web.restart()
		ctx.note(
			`wrangler dev restarted in ${((Date.now() - startedAt) / MS_PER_S).toFixed(1)} s`,
		)
		return startedAt
	}
	ctx.note(
		`DEPLOY NOW: ship a no-op change of the staging Worker (the clients are watching since ${iso(Date.now())})`,
	)
	await until(
		() => clients.every(client => client.drops.length > 0),
		Number(ctx.options.minutes ?? 10) * 60_000,
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
	const overlong = clients.filter(
		client => attemptsAfter(client, droppedAt).length > MAX_ATTEMPTS,
	)
	report.check(
		`no client made more than ${MAX_ATTEMPTS} attempts (the backoff's 1 s to 60 s steps cover 60 s in seven)`,
		!overlong.length,
		overlong.map(client => story(client, droppedAt)).join('\n  '),
	)
	report.check(
		'every retry waited for its chosen backoff delay',
		clients.every(client => respectsBackoff(client, droppedAt)),
		stories.join('\n  '),
	)
	report.check(
		`... and none dropped again in the ${STABLE_MS / MS_PER_S} s after it was back`,
		clients.every(client => client.drops.length === 1),
		clients
			.map(client => `${client.name}:${client.drops.length}`)
			.join(' '),
	)
}

const attemptsAfter = (client, since) =>
	client.attempts.filter(each => each.at >= since)

function respectsBackoff(client, since) {
	const attempts = attemptsAfter(client, since)
	return (
		attempts.length > 0 &&
		attempts.every(each => {
			const retry = client.retries.findLast(wait => wait.at <= each.at)
			if (!retry) return false
			const elapsed = each.at - retry.at
			return elapsed >= retry.waitMs && elapsed <= retry.waitMs + SLACK_MS
		})
	)
}

async function until(test, timeoutMs) {
	const deadline = Date.now() + timeoutMs
	while (!test() && Date.now() < deadline) await delay(POLL_MS)
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
