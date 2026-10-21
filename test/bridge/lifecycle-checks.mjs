// A paired hub's life (RFC 0001, 4.2 and 4.3): it closes its socket with `normal` when it stops,
// and the next start reads bridge.json and connects again with no login, its hello naming the
// new instance.
import { CLOSE_CODES } from '../../packages/contracts/dist/bridge.js'

import { waitUntil } from './hub-process.mjs'
import { nextUpgrade, opened } from './policy-wire.mjs'

const CLOSE_WAIT_MS = 15_000
const RESTART_WAIT_MS = 10_000

export async function checkStop({ report, fake, record }, hub) {
	report.section('hub stop and restart')
	const link = fake.sockets.hubs.get(record.hubId)
	await hub.stop()
	await report.step('the hub stops', () =>
		waitUntil(() => link?.closed, CLOSE_WAIT_MS, 'the close'),
	)
	report.check(
		`its socket closes with normal (${CLOSE_CODES.normal})`,
		link?.closed?.code === CLOSE_CODES.normal,
		JSON.stringify(link?.closed ?? null),
	)
}

// `since` is where the fake's attempts and frames stood before the hub started.
export async function checkRestart({ report, fake, record }, hub, since) {
	await report.step(
		'a restarted hub reads bridge.json and connects again',
		async () => {
			const next = await nextUpgrade(
				fake,
				since.upgrades,
				RESTART_WAIT_MS,
			)
			if (!opened(next) || next.hubId !== record.hubId)
				throw new Error(JSON.stringify(next))
		},
	)
	const health = await hub.health()
	await report.step('its hello names the new instance', () =>
		waitUntil(
			() =>
				fake.sockets.frames
					.slice(since.frames)
					.some(
						each =>
							each.frame?.t === 'hello' &&
							each.frame.hub.instanceId === health?.instanceId,
					),
			RESTART_WAIT_MS,
			'hello',
		),
	)
}
