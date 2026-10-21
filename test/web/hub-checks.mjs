// The person's hub on the web: `syneva login` approved on the device page, the tab's socket that
// then shows it, its revocation from the web as the hub itself hears it, and `syneva logout`.
import { existsSync, readFileSync } from 'node:fs'
import os from 'node:os'

import { BRIDGE_PATHS } from '../../packages/contracts/dist/bridge.js'
import {
	WEB_HUBS_PREFIX,
	WEB_PATHS,
} from '../../packages/contracts/dist/web.js'
import { runCli, spawnCli } from '../bridge/hub-process.mjs'
import { bridgeFile, isPairing, readLocal } from '../bridge/pairing-checks.mjs'
import { openReader, socketUrl, waitFor } from '../stream/stream-client.mjs'

import { HTTP_GONE, HTTP_OK } from './statuses.mjs'

const CODE_LINE = /confirm the code ([A-Z0-9]{4}-[A-Z0-9]{4})/
const CODE_WAIT_MS = 15_000
export const FRAME_WAIT_MS = 15_000
const HUB_ID = /^[a-f0-9]{16}$/
// The device page shows the hub's name as the CLI sent it (the hostname), cut to its cap.
const SHOWN_NAME_LENGTH = 20

// `syneva login` against the web, its code approved on the device page: the hub's id, or null.
export async function checkPairing(context) {
	const { report, browser, web } = context
	report.section('pairing')
	const login = spawnCli(context, ['login', '--web', web.origin, '--no-open'])
	const [, userCode] =
		(await login.line(CODE_LINE, CODE_WAIT_MS).catch(() => null)) ?? []
	report.check(
		'`syneva login` prints a XXXX-XXXX code and the device page to confirm it at',
		Boolean(userCode) &&
			login.output.stderr.includes(
				`${web.origin}${WEB_PATHS.device}?code=${userCode}`,
			),
		login.output.stderr,
	)
	if (!userCode) return null
	const page = await browser.fetch(`${WEB_PATHS.device}?code=${userCode}`)
	const text = await page.text()
	report.check(
		'the device page shows the hub that asked, with Approve and Deny',
		page.status === HTTP_OK &&
			text.includes(os.hostname().slice(0, SHOWN_NAME_LENGTH)) &&
			text.includes('Approve'),
		`${page.status}`,
	)
	const approved = await browser.post(WEB_PATHS.device, {
		userCode,
		approve: true,
	})
	report.check(
		'POST /device approves it',
		approved.status === HTTP_OK && approved.body.approved === true,
		JSON.stringify(approved.body),
	)
	const { code, stderr } = await login.exited
	report.check(
		'`syneva login` exits 0 once the hub is connected',
		code === 0 && /: the hub is connected\.$/m.test(stderr),
		stderr,
	)
	return checkPaired(context, userCode)
}

async function checkPaired({ report, browser, web, home }, userCode) {
	const record = readRecord(home)
	const isPaired =
		record.web === web.origin && HUB_ID.test(record.hubId ?? '')
	report.check(
		'bridge.json names the web and a 16-hex hub id',
		isPaired,
		JSON.stringify({ web: record.web, hubId: record.hubId }),
	)
	const spent = await browser.post(WEB_PATHS.device, {
		userCode,
		approve: true,
	})
	report.check(
		'the code pairs once: a second approval is 410 DEVICE_CLOSED',
		spent.status === HTTP_GONE && spent.body.code === 'DEVICE_CLOSED',
		`${spent.status}`,
	)
	if (!isPaired) return null
	return record.hubId
}

export async function checkTab({ report, browser, web }, hubId) {
	report.section("the tab's socket")
	const tab = openReader(
		socketUrl(web.origin, BRIDGE_PATHS.tabSocket),
		browser.headers(),
	)
	const outcome = await tab.outcome.catch(error => error.message)
	report.check(
		'a signed-in tab upgrade opens',
		outcome === 'open',
		`${outcome}`,
	)
	if (outcome !== 'open') return null
	await checkSnapshot(report, { tab, hubId })
	const hubs = await browser.json(WEB_PATHS.hubs)
	const [listed] = hubs.body.hubs ?? []
	report.check(
		'GET /api/web/hubs lists it online',
		hubs.status === HTTP_OK &&
			listed?.id === hubId &&
			listed.online === true,
		JSON.stringify(hubs.body),
	)
	return tab
}

// What a tab reads first: the hub online (the object's frame), then the hub's own snapshot.
async function checkSnapshot(report, { tab, hubId }) {
	const wait = (predicate, what) =>
		waitFor(tab, predicate, { what, timeoutMs: FRAME_WAIT_MS })
	await report.step(
		'a `hub` frame says the hub is online, with its version and last connect',
		() =>
			wait(
				frame =>
					frame?.t === 'hub' &&
					frame.hubId === hubId &&
					frame.online === true &&
					typeof frame.version === 'string' &&
					typeof frame.lastSeenAt === 'string',
				'hub { online: true }',
			),
	)
	await report.step(
		'the hub answers `snapshot?`: hello (its web id) then snapshot-end',
		async () => {
			await wait(
				frame => frame?.t === 'hello' && frame.hub?.id === hubId,
				'hello',
			)
			await wait(
				frame => frame?.t === 'snapshot-end' && frame.hubId === hubId,
				'snapshot-end',
			)
		},
	)
}

export async function checkRevoke({ report, browser, hub }, { hubId, tab }) {
	report.section('revoke from the web')
	const local = await readLocal(hub)
	const from = tab?.frames.length ?? 0
	const localFrom = local.frames.length
	const revoked = await browser.json(`${WEB_HUBS_PREFIX}${hubId}`, {
		method: 'DELETE',
	})
	report.check(
		`DELETE ${WEB_HUBS_PREFIX}<hubId> is 200`,
		revoked.status === HTTP_OK,
		`${revoked.status}`,
	)
	if (tab)
		await report.step('the tab reads the hub offline', () =>
			waitFor(
				tab,
				frame =>
					frame?.t === 'hub' &&
					frame.hubId === hubId &&
					frame.online === false,
				{
					from,
					what: 'hub { online: false }',
					timeoutMs: FRAME_WAIT_MS,
				},
			),
		)
	await report.step(
		"the hub's own stream says its link stopped: revoked",
		() =>
			waitFor(local, isPairing(isRevoked), {
				from: localFrom,
				what: 'pairing stopped (revoked)',
				timeoutMs: FRAME_WAIT_MS,
			}),
	)
	local.socket.close()
	const hubs = await browser.json(WEB_PATHS.hubs)
	report.check(
		'GET /api/web/hubs no longer lists it',
		hubs.body.hubs?.length === 0,
		JSON.stringify(hubs.body),
	)
}

// What bridge.json holds, or nothing when there is none.
function readRecord(home) {
	if (!existsSync(bridgeFile(home))) return {}
	return JSON.parse(readFileSync(bridgeFile(home), 'utf8'))
}

const isRevoked = pairing =>
	pairing.paired &&
	pairing.link.state === 'stopped' &&
	pairing.link.reason === 'revoked'

export async function checkLogout(context) {
	const { report, home } = context
	report.section('logout')
	const { code, stderr } = await runCli(context, ['logout'])
	report.check('`syneva logout` exits 0', code === 0, stderr)
	report.check('bridge.json is gone', !existsSync(bridgeFile(home)))
}
