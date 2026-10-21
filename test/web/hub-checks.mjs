// The person's hub on the web once paired (device-checks.mjs): the tab's socket that shows it, its
// revocation from the web as the hub itself hears it, and `syneva logout`.
import { existsSync } from 'node:fs'

import { BRIDGE_PATHS } from '../../packages/contracts/dist/bridge.js'
import {
	WEB_HUBS_PREFIX,
	WEB_PATHS,
} from '../../packages/contracts/dist/web.js'
import { runCli } from '../bridge/hub-process.mjs'
import { bridgeFile, isPairing, readLocal } from '../bridge/pairing-checks.mjs'
import { openReader, socketUrl, waitFor } from '../stream/stream-client.mjs'

import { HTTP_OK } from './statuses.mjs'

export const FRAME_WAIT_MS = 15_000

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
