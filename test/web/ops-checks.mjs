// The breaker as control-center's budget agent drives it: the status it reads, a trip that drains
// every object (the open tab closes with `saturated`) and refuses upgrades before any object is
// touched, then a clear.
import {
	BRIDGE_PATHS,
	CLOSE_CODES,
	WEB_HUB_HEADER,
} from '../../packages/contracts/dist/bridge.js'
import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'
import { openReader, socketUrl } from '../stream/stream-client.mjs'

import { FRAME_WAIT_MS } from './hub-checks.mjs'
import { HTTP_OK, HTTP_UNAVAILABLE } from './statuses.mjs'
import { pairSocketless } from './web-client.mjs'

export async function checkOps(context, tab) {
	const { report, browser, secrets } = context
	report.section('the breaker')
	const ops = { authorization: `Bearer ${secrets.OPS_TOKEN}` }
	const status = await browser.json(BRIDGE_PATHS.opsStatus, { headers: ops })
	report.check(
		'GET /bridge/v1/ops/status with the token: not tripped, one user, no live hub (revoked)',
		status.status === HTTP_OK &&
			status.body.tripped === false &&
			status.body.users === 1 &&
			status.body.hubsSeenLastDay === 0,
		JSON.stringify(status.body),
	)
	const trip = await browser.post(
		BRIDGE_PATHS.opsBreaker,
		{ tripped: true, reason: 'smoke' },
		ops,
	)
	report.check(
		'tripping it drains the objects',
		trip.status === HTTP_OK &&
			trip.body.tripped === true &&
			trip.body.drained === 1,
		JSON.stringify(trip.body),
	)
	if (tab) await checkDrained(report, tab)
	const refused = await tabOutcome(context)
	report.check(
		'while tripped, a tab upgrade is refused 503',
		refused === HTTP_UNAVAILABLE,
		`${refused}`,
	)
	await checkShedRelay(context)
	const clear = await browser.post(
		BRIDGE_PATHS.opsBreaker,
		{ tripped: false },
		ops,
	)
	report.check(
		'clearing it',
		clear.status === HTTP_OK && clear.body.tripped === false,
		JSON.stringify(clear.body),
	)
	const reopened = await tabOutcome(context)
	report.check(
		'cleared, a tab upgrade opens again',
		reopened === 'open',
		`${reopened}`,
	)
}

// The relay reads the breaker with the session and the hub's row: a live hub of the person's
// (paired over HTTP, never connected) is refused for the breaker, not for being offline.
async function checkShedRelay({ report, browser }) {
	const hubId = await pairSocketless(browser, 'smoke-shed')
	const shed = hubId
		? await browser.json(HUB_PATHS.plans, {
				headers: { [WEB_HUB_HEADER]: hubId },
			})
		: null
	report.check(
		'while tripped, a relay to a live hub of the person is 503 HUB_OFFLINE, the load shed',
		shed?.status === HTTP_UNAVAILABLE &&
			shed.body.code === 'HUB_OFFLINE' &&
			/shedding/.test(shed.body.error),
		JSON.stringify(shed?.body ?? { hubId }),
	)
}

async function checkDrained(report, tab) {
	const closed = await Promise.race([
		tab.closed,
		new Promise(resolve => {
			setTimeout(() => resolve({ code: 'still open' }), FRAME_WAIT_MS)
		}),
	])
	report.check(
		'the open tab closes with `saturated` (4029)',
		closed.code === CLOSE_CODES.saturated,
		`${closed.code}`,
	)
}

// A tab upgrade's outcome ('open' or the refusing status); an opened socket is closed at once.
async function tabOutcome({ browser, web }) {
	const tab = openReader(
		socketUrl(web.origin, BRIDGE_PATHS.tabSocket),
		browser.headers(),
	)
	const outcome = await tab.outcome.catch(error => error.message)
	if (outcome === 'open') tab.socket.close()
	return outcome
}
