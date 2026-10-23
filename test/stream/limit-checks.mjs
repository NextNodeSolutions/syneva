// The stream's bounds and guards: a ping's pong, `malformed` for anything else a tab sends, `rate`
// for a flood, `tooMany` past tabsPerUser, `goingAway` when the hub stops; and the upgrade behind
// every route's guards (Host, Origin, the key as a Bearer or the signed-in cookie).
import {
	BRIDGE_LIMITS,
	CLOSE_CODES,
	PING_TEXT,
	PONG_TEXT,
} from '../../packages/contracts/dist/bridge.js'
import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import {
	closeReader,
	closeWithin,
	openReader,
	readSnapshot,
	socketUrl,
	waitFor,
} from './stream-client.mjs'

const FLOOD_FRAMES = 1000
const FLOOD_DEADLINE_MS = 1000
const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404

export async function checkLimits({ report, url, headers }) {
	report.section('limits')
	await report.step('a ping gets its pong', async () => {
		const reader = await readSnapshot(url, headers)
		const from = reader.frames.length
		reader.socket.send(PING_TEXT)
		await waitFor(reader, (_frame, each) => each.text === PONG_TEXT, {
			from,
			what: PONG_TEXT,
		})
		await closeReader(reader)
	})
	for (const [what, payload] of [
		['a text frame other than the ping', '{"t":"x"}'],
		['a binary frame', Buffer.from(PING_TEXT)],
	])
		await report.step(
			`${what} closes with malformed (${CLOSE_CODES.malformed})`,
			async () => {
				const reader = await readSnapshot(url, headers)
				reader.socket.send(payload)
				await expectClose(reader, CLOSE_CODES.malformed)
			},
		)
	await report.step(
		`${FLOOD_FRAMES} frames close with rate (${CLOSE_CODES.rate}) within ${FLOOD_DEADLINE_MS} ms`,
		async () => {
			const reader = await readSnapshot(url, headers)
			const startedAt = Date.now()
			for (let sent = 0; sent < FLOOD_FRAMES; sent++)
				reader.socket.send(PING_TEXT)
			const { at } = await expectClose(reader, CLOSE_CODES.rate)
			if (at - startedAt > FLOOD_DEADLINE_MS)
				throw new Error(`closed after ${at - startedAt} ms`)
		},
	)
	await checkCap(report, url, headers)
}

// The tabsPerUser readers the hub holds all get their `hello`; one more is closed with tooMany
// before any frame. Run it on a hub no other tab is reading: those count too.
async function checkCap(report, url, headers) {
	const readers = []
	await report.step(
		`the socket past tabsPerUser (${BRIDGE_LIMITS.tabsPerUser}) closes with tooMany (${CLOSE_CODES.tooMany})`,
		async () => {
			for (let at = 0; at < BRIDGE_LIMITS.tabsPerUser; at++)
				readers.push(openReader(url, headers))
			await Promise.all(
				readers.map(reader =>
					waitFor(reader, frame => frame?.t === 'hello', {
						what: 'hello',
					}),
				),
			)
			const extra = openReader(url, headers)
			readers.push(extra)
			await expectClose(extra, CLOSE_CODES.tooMany)
			if (extra.frames.length)
				throw new Error('the extra socket got frames')
		},
	)
	await Promise.all(readers.map(closeReader))
}

// The close a step expects, within the client's wait: a hub that leaves the socket open fails the
// step (the flood's deadline, the cap, the shutdown) instead of holding the run forever.
async function expectClose(reader, code) {
	const closed = await closeWithin(reader)
	if (closed.code !== code) throw new Error(`closed with ${closed.code}`)
	return closed
}

// The upgrade's answer under each guard: refused with the route's status, or opened.
export async function checkGuards({ report, hub, url, headers, key }) {
	report.section('guards')
	const { host } = new URL(hub)
	const cases = [
		[
			'a cross-site Origin',
			{ ...headers, origin: 'http://evil.invalid' },
			HTTP_FORBIDDEN,
		],
		[
			'a foreign Host',
			{ ...headers, host: 'evil.invalid' },
			HTTP_FORBIDDEN,
		],
		[
			'the hub own Origin',
			{ ...headers, origin: `http://${host}` },
			'open',
		],
	]
	if (key)
		cases.push(
			['no key', {}, HTTP_UNAUTHORIZED],
			[
				'a wrong Bearer',
				{ authorization: 'Bearer nope' },
				HTTP_UNAUTHORIZED,
			],
			['the Bearer key', headers, 'open'],
			['the signed-in cookie', await signedIn(hub, key), 'open'],
		)
	for (const [what, sent, expected] of cases)
		report.check(
			`${what}: ${expected}`,
			(await outcomeOf(url, sent)) === expected,
		)
	const elsewhere = socketUrl(hub, `${HUB_PATHS.hubSocket}x`)
	report.check(
		`another path: ${HTTP_NOT_FOUND}`,
		(await outcomeOf(elsewhere, headers)) === HTTP_NOT_FOUND,
	)
}

async function outcomeOf(url, headers) {
	const reader = openReader(url, headers)
	const outcome = await reader.outcome.catch(error => error.message)
	if (outcome === 'open') await closeReader(reader)
	return outcome
}

// The cookie a browser holds once signed in at /login.
async function signedIn(hub, key) {
	const response = await fetch(new URL('/login', hub), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ key }),
		redirect: 'manual',
	})
	const [cookie = ''] = response.headers.getSetCookie()
	return { cookie: cookie.split(';')[0] }
}

// The hub stops (POST /api/hub/shutdown): a reader is closed with goingAway.
export async function checkShutdown({ report, url, headers, driver }) {
	report.section('shutdown')
	await report.step(
		`the hub stopping closes with goingAway (${CLOSE_CODES.goingAway})`,
		async () => {
			const reader = await readSnapshot(url, headers)
			await driver.json(HUB_PATHS.shutdown, { method: 'POST' })
			await expectClose(reader, CLOSE_CODES.goingAway)
		},
	)
}
