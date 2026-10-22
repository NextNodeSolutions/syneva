// A person's second tab (RFC 6.1 B10): the object asks the hub for a snapshot tagged with that
// tab, and hands it to that tab alone; the tab already open reads none of it, and the live stream
// after it (a desk opened and closed through the relay) reaches both, untagged. And the tabs' cap.
import {
	BRIDGE_LIMITS,
	BRIDGE_PATHS,
	TOO_MANY_STATUS,
	WEB_HUB_HEADER,
} from '../../packages/contracts/dist/bridge.js'
import { HUB_PATHS, hubDeskPath } from '../../packages/contracts/dist/routes.js'
import { scratchRepo } from '../stream/hub-driver.mjs'
import { openReader, socketUrl, waitFor } from '../stream/stream-client.mjs'

import { FRAME_WAIT_MS } from './hub-checks.mjs'
import { HTTP_OK } from './statuses.mjs'
import { upgradeAnswer } from './web-client.mjs'

const SESSION = 'web-smoke-tabs'
// What the open tab would have read by now had the snapshot gone to it too: the object sends
// both tabs' frames in the same turn, so the second tab's snapshot-end bounds the first's.
const SETTLE_MS = 1_000

export async function checkSecondTab(context, { hubId, tab }) {
	const { report, browser, web } = context
	report.section("a second tab's snapshot")
	const from = tab.frames.length
	const second = openReader(
		socketUrl(web.origin, BRIDGE_PATHS.tabSocket),
		browser.headers(),
	)
	const outcome = await second.outcome.catch(error => error.message)
	report.check('a second tab opens', outcome === 'open', `${outcome}`)
	if (outcome !== 'open') return null
	const end = await report.step(
		"it reads the hub's snapshot, hello to snapshot-end",
		() =>
			waitFor(second, isEnd(hubId), {
				what: 'snapshot-end',
				timeoutMs: FRAME_WAIT_MS,
			}),
	)
	if (!end) return second
	const frames = second.frames.map(each => each.frame)
	const snapshot = frames.slice(
		frames.findIndex(frame => frame?.t === 'hello'),
		frames.findIndex(isEnd(hubId)) + 1,
	)
	const [hello] = snapshot
	report.check(
		'each of its frames carries the one tag the object asked it with',
		hello?.t === 'hello' &&
			typeof hello.tag === 'string' &&
			snapshot.every(frame => frame.tag === hello.tag),
		snapshot.map(frame => `${frame.t}:${frame.tag}`).join(' '),
	)
	await new Promise(resolve => setTimeout(resolve, SETTLE_MS))
	const resent = tab.frames
		.slice(from)
		.map(each => each.frame?.t)
		.filter(kind => kind === 'hello' || kind === 'snapshot-end')
	report.check(
		'the tab already open reads none of it',
		!resent.length,
		resent.join(' '),
	)
	await checkLive(context, { hubId, tabs: [tab, second] })
	return second
}

// A desk opened and closed through the relay: both tabs read its `desk` and `closed`, untagged.
async function checkLive({ report, browser }, { hubId, tabs }) {
	const repo = await scratchRepo()
	const marks = tabs.map(each => each.frames.length)
	const opened = await browser.post(
		HUB_PATHS.desks,
		{ root: repo.root, session: SESSION, noGuide: true },
		{ [WEB_HUB_HEADER]: hubId },
	)
	const deskId = opened.body?.desk?.id ?? ''
	const closed = await browser.json(hubDeskPath(deskId), {
		method: 'DELETE',
		headers: { [WEB_HUB_HEADER]: hubId },
	})
	const isClosed = frame => frame?.t === 'closed' && frame.deskId === deskId
	const reads = await report.step(
		'both tabs read the live stream: the desk opened, then closed',
		() =>
			Promise.all(
				tabs.map((each, index) =>
					waitFor(each, isClosed, {
						from: marks[index],
						what: 'closed',
						timeoutMs: FRAME_WAIT_MS,
					}),
				),
			),
	)
	const live = tabs.flatMap((each, index) =>
		each.frames.slice(marks[index]).map(entry => entry.frame),
	)
	report.check(
		'none of its frames is tagged',
		opened.status === HTTP_OK &&
			closed.status === HTTP_OK &&
			Boolean(reads) &&
			live.some(frame => frame?.t === 'desk') &&
			live.every(frame => !('tag' in frame)),
		`${opened.status} ${closed.status}`,
	)
}

const isEnd = hubId => frame =>
	frame?.t === 'snapshot-end' && frame.hubId === hubId

// The tabs' cap (RFC 6.3 R6): with `tabsPerUser` of a person's tabs open (`open` of them already),
// the next upgrade is refused before any socket, 409 `TOO_MANY_TABS` (TOO_MANY_STATUS); one tab
// closed, the next opens.
export async function checkTabCap({ report, web }, { browser, open }) {
	const url = socketUrl(web.origin, BRIDGE_PATHS.tabSocket)
	const tabs = []
	try {
		while (open + tabs.length < BRIDGE_LIMITS.tabsPerUser) {
			const tab = openReader(url, browser.headers())
			tabs.push(tab)
			await tab.outcome
		}
		const refusal = await upgradeAnswer(
			web.origin,
			BRIDGE_PATHS.tabSocket,
			browser.headers(),
		)
		report.check(
			`with ${BRIDGE_LIMITS.tabsPerUser} tabs open, the next upgrade is refused: 409 \`TOO_MANY_TABS\`, in the error shape`,
			refusal.status === TOO_MANY_STATUS &&
				refusal.body?.code === 'TOO_MANY_TABS',
			JSON.stringify(refusal),
		)
		const closing = tabs.pop()
		closing?.socket.close()
		await closing?.closed
		const next = openReader(url, browser.headers())
		tabs.push(next)
		const outcome = await next.outcome.catch(error => error.message)
		report.check(
			'one closed, the next opens',
			outcome === 'open',
			`${outcome}`,
		)
	} finally {
		for (const tab of tabs) tab.socket.terminate()
	}
}
