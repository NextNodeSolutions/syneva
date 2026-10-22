// T10 breaker drill, edge stage (RFC 0001, 6.5 and 6.7): a WAF custom rule blocks every request to
// the app hostname but /bridge/v1/ops/*, created and deleted through the Cloudflare API. Clients
// get 403 on their upgrade and must wait five minutes; the Worker's invocation count stops moving;
// deleted, everyone is back within the backoff window. Only a deployed zone has an edge, so this
// is a procedure with a client-side trace: five tabs hold sockets the way the probe does (its
// policy module), are dropped when the rule is up, and every attempt they make is written down.
// `--procedures` prints the steps without running them.
import { PolicyClient } from './fakes/policy-client.mjs'
import { delay } from './fakes/timing.mjs'
import { iso } from './hold.mjs'
import { story } from './rfc-waits.mjs'
import { EDGE_STAGE_STEPS } from './staging-reads.mjs'

const TABS = 5
const FIVE_MINUTES_MS = 300_000
const GAP_SLACK_MS = 10_000
const UP_WITHIN_MS = 60_000
const BACK_WITHIN_MS = FIVE_MINUTES_MS + 60_000
const POLL_MS = 500
const MS_PER_S = 1000
const MS_PER_MINUTE = 60_000
const EDGE_STATUSES = new Set([403, 429])

async function run(ctx) {
	const { report, options } = ctx
	const host = hostOf(ctx)
	process.stdout.write(
		`\nprocedure (a person's):\n${EDGE_STAGE_STEPS(host)
			.map(line => `  ${line}`)
			.join('\n')}\n\n`,
	)
	const account = await ctx.account(0)
	const clients = []
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
			`${TABS} tabs are connected`,
			clients.every(client => client.isOpen),
			'',
		)
		await ctx.prompt(
			'Do steps 1 to 3 now (the rule is up and the edge answers 403). Press Enter and the sockets are dropped',
		)
		const droppedAt = Date.now()
		for (const client of clients) client.peer.terminate()
		const observeMs = Number(options.minutes ?? 11) * MS_PER_MINUTE
		await delay(observeMs)
		judgeRefusals(ctx, clients, {
			droppedAt,
			windowMs: Date.now() - droppedAt,
		})
		await ctx.prompt(
			'Do step 4 now (delete the rule). Press Enter when it is gone',
		)
		const deletedAt = Date.now()
		await until(
			() => clients.every(client => client.isOpen),
			BACK_WITHIN_MS,
		)
		judgeReturn(ctx, clients, deletedAt)
	} finally {
		for (const client of clients) await client.stop()
	}
	ctx.printReads('T10', { from: null, to: iso(Date.now()) })
}

// While the rule is up: refused at the edge each time, and at most one attempt per client per
// five minutes after the first.
export function judgeRefusals({ report }, clients, { droppedAt, windowMs }) {
	const after = client => client.attempts.filter(each => each.at >= droppedAt)
	report.check(
		'every attempt while the rule was up was refused at the edge (403 or 429), none opened',
		clients.every(client => {
			const attempts = after(client)
			return (
				attempts.length > 0 &&
				attempts.every(each => EDGE_STATUSES.has(each.outcome))
			)
		}),
		clients.map(client => story(client, droppedAt)).join('\n  '),
	)
	const spaced = client => {
		const refused = after(client)
		return refused.every(
			(each, at) =>
				at === 0 ||
				each.at - refused[at - 1].at >= FIVE_MINUTES_MS - GAP_SLACK_MS,
		)
	}
	report.check(
		'... and after its first refusal, no client tried again sooner than five minutes later',
		clients.every(spaced),
		clients.map(client => story(client, droppedAt)).join('\n  '),
	)
	const most = Math.ceil(windowMs / FIVE_MINUTES_MS) + 1
	report.check(
		`... so at most ${most} attempts per client in ${(windowMs / MS_PER_S / 60).toFixed(1)} min`,
		clients.every(client => after(client).length <= most),
		clients
			.map(client => `${client.name}:${after(client).length}`)
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

async function until(test, timeoutMs) {
	const deadline = Date.now() + timeoutMs
	while (!test() && Date.now() < deadline) await delay(POLL_MS)
}

export const t10 = {
	id: 'T10',
	title: 'breaker drill, edge stage',
	where: 'staging',
	run,
	procedure: ctx => {
		process.stdout.write(
			`${EDGE_STAGE_STEPS(hostOf(ctx))
				.map(line => `  ${line}`)
				.join('\n')}\n`,
		)
		ctx.printReads('T10', {})
	},
	skipHint: 'a WAF rule needs a deployed zone; --procedures prints the steps',
}
