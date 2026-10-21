// The relay as a tab on the web uses it: a desk opened on the paired hub (the hub named by the
// header), its state read and a comment and a question posted (the desk named by its web id), each
// heard back on the tab's socket and in the hub's own journal; then what the Worker refuses before
// any object is touched.
import {
	BRIDGE_LIMITS,
	WEB_HUB_HEADER,
	webDeskId,
} from '../../packages/contracts/dist/bridge.js'
import {
	API_PATHS,
	deskApiBase,
	HUB_PATHS,
} from '../../packages/contracts/dist/routes.js'
import { scratchRepo } from '../stream/hub-driver.mjs'
import { waitFor } from '../stream/stream-client.mjs'

import { FRAME_WAIT_MS } from './hub-checks.mjs'
import { HTTP_NOT_FOUND, HTTP_OK, HTTP_TOO_LARGE } from './statuses.mjs'

const SESSION = 'web-smoke'
const SHOWN_BODY = 300
const ANCHOR = { path: 'a.txt', lineNumber: 2, side: 'additions' }

const isJournal = (kind, deskId) => frame =>
	frame?.t === 'journal' &&
	frame.events.some(event => event.kind === kind && event.deskId === deskId)

export async function checkRelay(context, { hubId, tab }) {
	context.report.section('the relay')
	const deskId = await openDesk(context, { hubId, tab })
	if (!deskId) return
	await readState(context, deskId)
	await postRound(context, { hubId, tab, deskId })
	await checkRefusals(context, { hubId, deskId })
}

async function openDesk({ report, browser }, { hubId, tab }) {
	const repo = await scratchRepo()
	const from = tab.frames.length
	const opened = await browser.post(
		HUB_PATHS.desks,
		{ root: repo.root, session: SESSION, noGuide: true },
		{ [WEB_HUB_HEADER]: hubId },
	)
	const deskId = opened.body?.desk?.id ?? ''
	const isOpened =
		opened.status === HTTP_OK &&
		deskId.startsWith(hubId) &&
		deskId.length > hubId.length
	report.check(
		`POST ${HUB_PATHS.desks} with ${WEB_HUB_HEADER} opens a desk named by its web id`,
		isOpened,
		`${opened.status} ${JSON.stringify(opened.body).slice(0, SHOWN_BODY)}`,
	)
	if (!isOpened) return null
	const wait = (predicate, what) =>
		waitFor(tab, predicate, { from, what, timeoutMs: FRAME_WAIT_MS })
	await report.step(
		'the tab reads its `desk` frame and its desk-opened journal event',
		async () => {
			await wait(
				frame => frame?.t === 'desk' && frame.desk.id === deskId,
				'desk',
			)
			await wait(isJournal('desk-opened', deskId), 'desk-opened')
		},
	)
	return deskId
}

async function readState({ report, browser }, deskId) {
	const route = `${deskApiBase(deskId)}${API_PATHS.state}`
	const state = await browser.json(route)
	report.check(
		`GET ${route} answers the desk's state through the relay`,
		state.status === HTTP_OK &&
			typeof state.body === 'object' &&
			state.body !== null,
		`${state.status}`,
	)
	report.check(
		'a relayed answer is sandboxed (CSP) and never sniffed',
		/sandbox/.test(state.headers.get('content-security-policy') ?? '') &&
			state.headers.get('x-content-type-options') === 'nosniff',
		`${state.headers.get('content-security-policy')}`,
	)
}

async function postRound({ report, browser, hub }, { hubId, tab, deskId }) {
	const desk = deskApiBase(deskId)
	const wait = (predicate, what, from) =>
		waitFor(tab, predicate, { from, what, timeoutMs: FRAME_WAIT_MS })
	const commentFrom = tab.frames.length
	const comment = await browser.post(`${desk}${API_PATHS.comment}`, {
		...ANCHOR,
		body: 'from the web',
	})
	report.check(
		`POST ${API_PATHS.comment} through the relay`,
		comment.status === HTTP_OK,
		`${comment.status}`,
	)
	await report.step('the tab reads the comment in its pulse', () =>
		wait(
			frame =>
				frame?.t === 'pulse' &&
				frame.deskId === deskId &&
				frame.pulse.comments.length > 0,
			'pulse with the comment',
			commentFrom,
		),
	)
	const askFrom = tab.frames.length
	const asked = await browser.post(`${desk}${API_PATHS.ask}`, {
		...ANCHOR,
		body: 'why?',
	})
	report.check(
		`POST ${API_PATHS.ask} through the relay`,
		asked.status === HTTP_OK,
		`${asked.status}`,
	)
	await report.step('the tab reads the question-asked journal event', () =>
		wait(isJournal('question-asked', deskId), 'question-asked', askFrom),
	)
	const localId = deskId.slice(hubId.length)
	const journal = await fetch(new URL(HUB_PATHS.journal, hub.url)).then(
		response => response.json(),
	)
	report.check(
		"the local hub's journal holds the same event, by the local id",
		isJournal(
			'question-asked',
			localId,
		)({ t: 'journal', events: journal.events ?? [] }),
		JSON.stringify(journal).slice(0, SHOWN_BODY),
	)
}

async function checkRefusals({ report, browser }, { hubId, deskId }) {
	const desk = deskApiBase(deskId)
	const poll = await browser.json(`${desk}${API_PATHS.poll}`)
	report.check(
		'a route no hub answers on the web is 404 NOT_RELAYED',
		poll.status === HTTP_NOT_FOUND && poll.body.code === 'NOT_RELAYED',
		`${poll.status} ${poll.body?.code}`,
	)
	const otherHub = [...hubId]
		.map(digit => (digit === 'f' ? 'e' : 'f'))
		.join('')
	const foreign = await browser.json(
		`${deskApiBase(webDeskId(otherHub, deskId.slice(hubId.length)))}${API_PATHS.state}`,
	)
	report.check(
		'a web id naming another hub is 404 HUB_NOT_FOUND',
		foreign.status === HTTP_NOT_FOUND &&
			foreign.body.code === 'HUB_NOT_FOUND',
		`${foreign.status} ${foreign.body?.code}`,
	)
	const unnamed = await browser.post(HUB_PATHS.desks, { root: '/nowhere' })
	report.check(
		`a hub-level route without ${WEB_HUB_HEADER} is 404 HUB_NOT_FOUND`,
		unnamed.status === HTTP_NOT_FOUND &&
			unnamed.body.code === 'HUB_NOT_FOUND',
		`${unnamed.status} ${unnamed.body?.code}`,
	)
	const large = await browser.json(`${desk}${API_PATHS.comment}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: 'x'.repeat(BRIDGE_LIMITS.requestBodyBytes + 1),
	})
	report.check(
		'a body over requestBodyBytes is 413 TOO_LARGE',
		large.status === HTTP_TOO_LARGE && large.body.code === 'TOO_LARGE',
		`${large.status}`,
	)
}
