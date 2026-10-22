// The connected caps (RFC 6.3 R6): a person pairs up to 32 hubs, and `hubsPerUser` of them connect
// at once. A third account pairs eight hubs over HTTP and opens their sockets itself, then pairs
// a running hub with `syneva login`: the web refuses that ninth upgrade with TOO_MANY_STATUS, and
// nothing calls it connected - not `login`, not its own Hub page, not the person's tab, not its
// row (a refused upgrade writes no `last_seen_at`). A place freed, it connects on its next attempt.
// Then its tabs, up to `tabsPerUser` (tab-checks.mjs).
import { existsSync, readFileSync } from 'node:fs'

import {
	BRIDGE_LIMITS,
	BRIDGE_PATHS,
	TOO_MANY_STATUS,
} from '../../packages/contracts/dist/bridge.js'
import {
	WEB_HUBS_PREFIX,
	WEB_PATHS,
} from '../../packages/contracts/dist/web.js'
import { spawnCli, startHub, waitUntil } from '../bridge/hub-process.mjs'
import { bridgeFile, isPairing, readLocal } from '../bridge/pairing-checks.mjs'
import { openReader, socketUrl, waitFor } from '../stream/stream-client.mjs'

import { FRAME_WAIT_MS } from './hub-checks.mjs'
import { HTTP_OK } from './statuses.mjs'
import { checkTabCap } from './tab-checks.mjs'
import {
	approveByForm,
	openDevicePage,
	pairHub,
	signInAs,
	upgradeAnswer,
} from './web-client.mjs'

export const THIRD_EMAIL = 'smoke-3@example.com'
// A client of its own to the sign-in limits (the documentation range).
const THIRD_CLIENT = { 'cf-connecting-ip': '198.51.100.30' }
const CODE_LINE = /confirm the code ([A-Z0-9]{4}-[A-Z0-9]{4})/
// The ninth hub's waits, scaled so its next attempt comes within seconds (TOO_MANY_STATUS: 3 s).
const WAIT_SCALE = '0.05'
const TOO_MANY = /too many hubs connected on this account/

export async function checkConnectedCap(context) {
	const { report } = context
	report.section('the connected caps')
	const browser = await signInAs(context.web, THIRD_EMAIL, THIRD_CLIENT)
	report.check('a third account signs in', Boolean(browser))
	if (!browser) return
	const tab = openReader(
		socketUrl(context.web.origin, BRIDGE_PATHS.tabSocket),
		browser.headers(),
	)
	const held = []
	const spare = await startHub({
		cli: context.cli,
		home: context.spareHome,
		port: context.sparePort,
		env: { SYNEVA_BRIDGE_WAIT_SCALE: WAIT_SCALE },
	})
	try {
		await tab.outcome
		held.push(...(await connectEight(context, { browser, tab })))
		const ninth = await pairNinth(context, browser)
		if (ninth)
			await checkRefused(context, { browser, tab, spare, ninth, held })
		await revokeAll(browser)
		await checkTabCap(context, { browser, open: 1 })
	} finally {
		for (const hub of held) hub.reader.socket.terminate()
		tab.socket.terminate()
		await spare.stop()
	}
}

// Eight hubs paired, each from its own /64 (the pairing limit counts a client), their sockets
// opened with their tokens: each reads online on the person's tab.
async function connectEight({ report, web }, { browser, tab }) {
	const held = []
	for (let index = 0; index < BRIDGE_LIMITS.hubsPerUser; index += 1) {
		const paired = await pairHub(browser, {
			name: `cap-${index + 1}`,
			address: `2001:db8:ca9:${index + 1}::1`,
		})
		if (!paired) break
		const from = tab.frames.length
		const reader = openReader(
			socketUrl(web.origin, BRIDGE_PATHS.hubSocket),
			{ authorization: `Bearer ${paired.token}` },
		)
		await reader.outcome
		const online = await waitFor(tab, isHub(paired.hubId, true), {
			from,
			timeoutMs: FRAME_WAIT_MS,
		}).catch(() => null)
		if (online) held.push({ ...paired, reader })
	}
	report.check(
		`${BRIDGE_LIMITS.hubsPerUser} hubs connect, each read online by the person's tab`,
		held.length === BRIDGE_LIMITS.hubsPerUser,
		`${held.length}`,
	)
	return held
}

// The ninth, a running hub paired with `syneva login`, approved with the page's form: the page says
// how many connect at once, the web refuses its upgrade, and login says it could not, for the cap.
async function pairNinth(context, browser) {
	const { report, web, cli, spareHome } = context
	const login = spawnCli({ cli, home: spareHome }, [
		'login',
		'--web',
		web.origin,
		'--no-open',
	])
	const [, userCode] = (await login.line(CODE_LINE, FRAME_WAIT_MS)) ?? []
	const { proof } = await openDevicePage(browser, userCode)
	const approved = await approveByForm(browser, { userCode, proof })
	report.check(
		`the approved page says up to ${BRIDGE_LIMITS.hubsPerUser} hubs connect at once`,
		approved.status === HTTP_OK &&
			approved.text.includes('is paired.') &&
			approved.text.includes(
				`Up to ${BRIDGE_LIMITS.hubsPerUser} of your hubs connect at once`,
			),
		`${approved.status}`,
	)
	const { code, stderr } = await login.exited
	report.check(
		'a ninth hub paired with `syneva login`: login says it could not connect yet, too many hubs connected on this account',
		code === 0 &&
			/could not connect yet: too many hubs connected on this account \(HTTP 409\)/.test(
				stderr,
			) &&
			!/the hub is connected/.test(stderr),
		stderr,
	)
	if (!existsSync(bridgeFile(spareHome))) return null
	const { hubId, token } = JSON.parse(
		readFileSync(bridgeFile(spareHome), 'utf8'),
	)
	if (!hubId || !token) return null
	return { hubId, token }
}

async function checkRefused(context, { browser, tab, spare, ninth, held }) {
	const { report } = context
	const local = await readLocal(spare)
	await report.step(
		'its own Hub page reads why: too many hubs connected on this account (HTTP 409), and it waits',
		() =>
			waitFor(
				local,
				isPairing(
					({ link, lastClose }) =>
						link.state === 'backoff' &&
						lastClose?.status === TOO_MANY_STATUS &&
						TOO_MANY.test(lastClose.reason),
				),
				{ timeoutMs: FRAME_WAIT_MS },
			),
	)
	await checkUpgradeRefused(context, ninth)
	await report.step(
		"the person's tab reads it offline, refused at the cap (`refusedAt`)",
		() =>
			waitFor(
				tab,
				frame =>
					isHub(ninth.hubId, false)(frame) &&
					typeof frame.refusedAt === 'string',
				{ timeoutMs: FRAME_WAIT_MS },
			),
	)
	const rows = await browser.json(WEB_PATHS.hubs)
	const listed = rows.body?.hubs ?? []
	const refused = listed.find(hub => hub.id === ninth.hubId)
	const connected = listed.filter(hub => hub.online)
	report.check(
		'the hubs list: the eight online with a last connect, the ninth offline and never connected (no write for a refused upgrade)',
		connected.length === BRIDGE_LIMITS.hubsPerUser &&
			connected.every(hub => typeof hub.lastSeenAt === 'string') &&
			refused?.online === false &&
			refused.lastSeenAt === null &&
			!tab.frames.some(each => isHub(ninth.hubId, true)(each.frame)),
		JSON.stringify(listed),
	)
	await checkFreedPlace(context, { browser, tab, local, ninth, held })
	local.socket.close()
}

// The upgrade itself, as raw HTTP: refused before any socket, in the Worker's error shape.
async function checkUpgradeRefused({ report, web }, ninth) {
	const refusal = await upgradeAnswer(web.origin, BRIDGE_PATHS.hubSocket, {
		authorization: `Bearer ${ninth.token}`,
	})
	report.check(
		'its upgrade is refused before any socket: 409 `TOO_MANY_HUBS`, in the error shape',
		refusal.status === TOO_MANY_STATUS &&
			refusal.body?.code === 'TOO_MANY_HUBS' &&
			typeof refusal.body.error === 'string',
		JSON.stringify(refusal),
	)
}

// One of the eight leaves: the ninth connects on its next attempt, and only now is its row's
// last connect written.
async function checkFreedPlace(
	{ report },
	{ browser, tab, local, ninth, held },
) {
	const from = tab.frames.length
	const localFrom = local.frames.length
	held.shift()?.reader.socket.close()
	await report.step(
		'a place freed, it connects on its next attempt: online on the tab, connected on its Hub page',
		async () => {
			await waitFor(tab, isHub(ninth.hubId, true), {
				from,
				timeoutMs: FRAME_WAIT_MS,
			})
			await waitFor(
				local,
				isPairing(pairing => pairing.link.state === 'connected'),
				{ from: localFrom, timeoutMs: FRAME_WAIT_MS },
			)
		},
	)
	await report.step('and its row now holds a last connect', () =>
		waitUntil(
			async () => {
				const rows = await browser.json(WEB_PATHS.hubs)
				const row = rows.body?.hubs?.find(hub => hub.id === ninth.hubId)
				return typeof row?.lastSeenAt === 'string'
			},
			FRAME_WAIT_MS,
			'a last connect',
		),
	)
}

// The account's hubs revoked, so the breaker's status after counts none of them as live.
async function revokeAll(browser) {
	const rows = await browser.json(WEB_PATHS.hubs)
	for (const hub of rows.body?.hubs ?? [])
		await browser.json(`${WEB_HUBS_PREFIX}${hub.id}`, { method: 'DELETE' })
}

const isHub = (hubId, isOnline) => frame =>
	frame?.t === 'hub' && frame.hubId === hubId && frame.online === isOnline
