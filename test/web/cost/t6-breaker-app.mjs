// T6 breaker drill, app stage (RFC 0001, 6.5 and 6.7): control-center's two calls on the ops
// route. A wrong or missing token is 403 and touches nothing; the right one trips the breaker,
// which drains the object (every socket closes `saturated`), refuses upgrades (503) and answers
// relays 503 before any object is touched; clearing it lets everyone back in. Two tabs run the
// frontend's own transport (fakes/browser-tab.mjs) through it: one live when the breaker trips
// (drained with 4029), one opened while it is up (refused 503, which only its probe can read); both
// must wait their five minutes and no less (rfc-waits.mjs), then be back.
import { CLOSE_CODES } from '../../../packages/contracts/dist/bridge.js'
import { waitFor } from '../../stream/stream-client.mjs'

import { BrowserTab } from './fakes/browser-tab.mjs'
import { delay } from './fakes/timing.mjs'
import { until } from './fleet.mjs'
import { failureOf, relayGet } from './relay-client.mjs'
import { judgeWaits, story } from './rfc-waits.mjs'
import { closeOf, describeClose, isOpen, openHub } from './sockets.mjs'

const HTTP_FORBIDDEN = 403
const HTTP_UNAVAILABLE = 503
const WAIT_MS = 8000
// A tab's transport hears a close when its socket ends, which workerd's dev server holds 10 s past
// its close frame (fakes/ws.mjs); a browser stops waiting for that within seconds.
const PAGE_CLOSE_MS = 20_000
const SATURATED_WAIT_MS = 300_000
const BACK_WITHIN_MS = SATURATED_WAIT_MS + 60_000

async function run(ctx) {
	const { report, ops } = ctx
	if (!ops.hasToken)
		return report.check('an ops token is needed (--ops-token)', false)
	const account = await ctx.account(0)
	const hub = await openHub(ctx, account, 0, { answerSnapshots: true })
	hub.handler = req => hub.answerJson(req.id, { ok: true })
	const tabs = [await ctx.tab(account), await ctx.tab(account)]
	const pages = [browserTab(ctx, account, 'live tab')]
	await until(() => pages[0].isOpen, WAIT_MS)
	try {
		await refusedWithoutToken(ctx, { hub, tabs: [...tabs, ...pages] })
		const trippedAt = Date.now()
		await tripped(ctx, account, { hub, tabs, pages, trippedAt })
		await cleared(ctx, account, hub)
		await pagesBack(ctx, pages, trippedAt)
	} finally {
		await ops.breaker({ tripped: false })
		for (const page of pages) await page.stop()
	}
	ctx.printReads('T6', { from: null, to: null })
	return undefined
}

function browserTab(ctx, account, name) {
	const page = ctx.track(
		new BrowserTab({
			name,
			origin: ctx.web.origin,
			cookie: account.browser.jar.cookie,
		}),
	)
	page.start()
	return page
}

async function refusedWithoutToken({ report, ops }, { hub, tabs }) {
	const before = await ops.status()
	report.check(
		'the breaker starts clear',
		before.status === 200 && before.body.tripped === false,
		JSON.stringify(before.body),
	)
	const wrong = await ops.breaker(
		{ tripped: true, reason: 'wrong' },
		'not-the-token',
	)
	const none = await ops.breaker({ tripped: true, reason: 'none' }, null)
	const read = await ops.status('not-the-token')
	report.check(
		'a wrong or a missing OPS_TOKEN is 403 (breaker and status alike)',
		[wrong, none, read].every(each => each.status === HTTP_FORBIDDEN),
		[wrong, none, read].map(each => each.status).join(','),
	)
	await delay(300)
	const after = await ops.status()
	report.check(
		'... and touched nothing: still clear, every socket open',
		after.body.tripped === false && isOpen(hub, ...tabs),
		JSON.stringify(after.body),
	)
}

async function tripped(ctx, account, { hub, tabs, pages, trippedAt }) {
	const { report, ops } = ctx
	const trip = await ops.breaker({ tripped: true, reason: 'cost drill' })
	report.check(
		'the right token trips it and drains every object',
		trip.status === 200 &&
			trip.body.tripped === true &&
			trip.body.drained >= 1,
		JSON.stringify(trip.body),
	)
	const closed = await Promise.all(
		[hub, ...tabs].map(peer => closeOf(peer, WAIT_MS)),
	)
	report.check(
		`... the open tabs and the hub close ${CLOSE_CODES.saturated} (saturated)`,
		closed.every(each => each?.code === CLOSE_CODES.saturated),
		closed.map(describeClose).join(', '),
	)
	const [live] = pages
	await until(() => live.retries.length > 0, PAGE_CLOSE_MS)
	report.check(
		"... and the live tab's transport reads the 4029 and waits (`saturated`)",
		live.drops.at(-1)?.code === CLOSE_CODES.saturated &&
			live.link?.kind === 'saturated',
		story(live, trippedAt),
	)
	const late = browserTab(ctx, account, 'tab opened while tripped')
	pages.push(late)
	await until(() => late.retries.length > 0, WAIT_MS)
	report.check(
		"... a tab opened while it is tripped: its transport's probe reads the upgrade's 503 and it waits (`saturated`)",
		late.attempts[0]?.outcome === HTTP_UNAVAILABLE &&
			late.link?.kind === 'saturated',
		story(late, trippedAt),
	)
	const relay = await relayGet(account, hub)
	const body = await failureOf(relay)
	report.check(
		'... a relay answers 503 HUB_OFFLINE',
		relay.status === HTTP_UNAVAILABLE && body?.code === 'HUB_OFFLINE',
		`${relay.status} ${JSON.stringify(body)}`,
	)
	const tab = await ctx.tab(account, { connect: false })
	const hubAgain = await ctx.hub(account, 0)
	const [tabOutcome, hubOutcome] = [
		await tab.attempt(),
		await hubAgain.attempt(),
	]
	report.check(
		'... a tab upgrade and a hub upgrade are 503 SATURATED',
		tabOutcome.outcome === HTTP_UNAVAILABLE &&
			hubOutcome.outcome === HTTP_UNAVAILABLE,
		`${tabOutcome.outcome}, ${hubOutcome.outcome}`,
	)
	const status = await ops.status()
	report.check(
		'... the status says tripped, with the reason',
		status.body.tripped === true && status.body.reason === 'cost drill',
		JSON.stringify(status.body),
	)
}

// Each tab of the frontend's waits five minutes from what refused it, then is back; none tried in
// between, whatever the breaker did meanwhile.
async function pagesBack({ report }, pages, trippedAt) {
	const clearedAt = Date.now()
	const isBack = page => page.opens.some(at => at > trippedAt)
	const triedAgain = page => {
		const waited = page.retries.find(retry => retry.at >= trippedAt)
		return page.attempts.filter(
			each => waited && each.at > waited.at && each.at < clearedAt,
		)
	}
	report.check(
		"while the breaker was up, neither tab's transport tried again",
		pages.every(page => !triedAgain(page).length),
		pages.map(page => story(page, trippedAt)).join('\n  '),
	)
	await until(() => pages.every(isBack), BACK_WITHIN_MS)
	report.check(
		`the breaker cleared, both tabs are back (within ${BACK_WITHIN_MS / 1000} s of the clear)`,
		pages.every(isBack),
		pages.map(page => story(page, trippedAt)).join('\n  '),
	)
	judgeWaits(report, pages, { since: trippedAt })
}

async function cleared(ctx, account, hub) {
	const { report, ops } = ctx
	const clear = await ops.breaker({ tripped: false })
	report.check(
		'clearing it with the same call',
		clear.status === 200 && clear.body.tripped === false,
		JSON.stringify(clear.body),
	)
	const reopened = await openHub(ctx, account, 0, { answerSnapshots: true })
	const tab = await ctx.tab(account)
	report.check(
		'... a hub and a tab come back',
		reopened.isOpen && tab.isOpen,
		`hub ${reopened.isOpen}, tab ${tab.isOpen}`,
	)
	await report.step(
		'... and the tab reads the hub online in a `hub` frame',
		() =>
			waitFor(
				tab,
				frame =>
					frame?.t === 'hub' &&
					frame.hubId === hub.hubId &&
					frame.online === true,
				{ what: 'hub { online: true }', timeoutMs: WAIT_MS },
			),
	)
	const relay = await relayGet(account, reopened)
	report.check(
		'... a relay is answered again',
		relay.status === 200,
		`${relay.status}`,
	)
	const status = await ops.status()
	report.check(
		'... and the status is clear again',
		status.body.tripped === false && status.body.reason === null,
		JSON.stringify(status.body),
	)
}

export const t6 = {
	id: 'T6',
	title: 'breaker drill, app stage',
	where: 'local',
	run,
}
