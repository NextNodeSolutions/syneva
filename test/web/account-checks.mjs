// A second account, signed in beside the first: what one person's budget spends never touches
// another's. Its tab upgrades are limited per person (RL_TABS, sixty a minute), and the plain GET a
// tab sends to learn why an upgrade failed meets the same limit before it hears 426.
import { BRIDGE_PATHS } from '../../packages/contracts/dist/bridge.js'
import { WEB_PATHS } from '../../packages/contracts/dist/web.js'
import { openReader, socketUrl } from '../stream/stream-client.mjs'

import {
	HTTP_ACCEPTED,
	HTTP_TOO_MANY,
	HTTP_UPGRADE_REQUIRED,
} from './statuses.mjs'
import { createBrowser, followLink } from './web-client.mjs'

export const SECOND_EMAIL = 'smoke-2@example.com'
// apps/web's wrangler.jsonc: RL_TABS.
const TAB_UPGRADES_PER_MINUTE = 60

// Signs the second account in; its browser, or null when no session came.
export async function checkSecondAccount(context) {
	const { report } = context
	report.section('a second account')
	const second = await signInAs(context, SECOND_EMAIL)
	report.check('a second account signs in', Boolean(second))
	if (!second) return null
	await checkTabLimit(context, second)
	return second
}

async function signInAs({ web }, email) {
	const browser = createBrowser(web.origin)
	const seen = web.links().length
	const asked = await browser.post(WEB_PATHS.magicLink, { email })
	if (asked.status !== HTTP_ACCEPTED) return null
	browser.keep(await followLink(browser, await web.link(seen)))
	if (!browser.jar.cookie) return null
	return browser
}

async function checkTabLimit({ report, web }, browser) {
	const probes = []
	for (let index = 0; index < TAB_UPGRADES_PER_MINUTE; index += 1)
		probes.push(await browser.json(BRIDGE_PATHS.tabSocket))
	const past = await browser.json(BRIDGE_PATHS.tabSocket)
	report.check(
		"a tab's plain GET passes the guards, then 426, sixty times; then 429 RATE_LIMITED",
		probes.every(probe => probe.status === HTTP_UPGRADE_REQUIRED) &&
			past.status === HTTP_TOO_MANY &&
			past.body.code === 'RATE_LIMITED',
		`${probes.filter(probe => probe.status === HTTP_UPGRADE_REQUIRED).length} then ${past.status}`,
	)
	const tab = openReader(
		socketUrl(web.origin, BRIDGE_PATHS.tabSocket),
		browser.headers(),
	)
	const outcome = await tab.outcome.catch(error => error.message)
	if (outcome === 'open') tab.socket.close()
	report.check(
		"past its budget, the account's tab upgrade is refused 429",
		outcome === HTTP_TOO_MANY,
		`${outcome}`,
	)
}
