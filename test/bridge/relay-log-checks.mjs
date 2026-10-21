// What the web did on the machine, read back from the hub's own log (relay-log.ts): one line for
// every relayed request but a GET - its method, its path as the hub read it, its status and
// failure code, the desk it acted on by its hub-side id - and never its body. Run once the relay,
// refusal and machine checks left their requests in the log.
import { promises as fs } from 'node:fs'

import { deskApiBase, HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import { NOTE_PREFIX } from './relay-checks.mjs'

const RELAYED = 'bridge: relayed '

export async function checkRelayLog(context, desk) {
	const { report, hub } = context
	report.section('relay: the hub log')
	const log = await fs.readFile(hub.logFile, 'utf8')
	const lines = log.split('\n').filter(line => line.includes(RELAYED))
	const has = line => lines.some(each => each.endsWith(line))
	const base = deskApiBase(desk.localId)
	const expected = [
		[
			'a relayed comment, by the desk it landed on',
			`${RELAYED}POST ${base}/comment answered 200 (desk ${desk.localId})`,
		],
		[
			'a relayed settings write',
			`${RELAYED}POST ${base}/settings answered 200 (desk ${desk.localId})`,
		],
		[
			'a relayed open refused, with its code',
			`${RELAYED}POST ${HUB_PATHS.desks} answered 403 NOT_SERVED`,
		],
		[
			'a path the probe never relays, with its code',
			`${RELAYED}POST ${HUB_PATHS.shutdown} answered 404 NOT_RELAYED`,
		],
	]
	for (const [what, line] of expected)
		report.check(`the hub logs ${what}`, has(line), line)
	const opened = new RegExp(
		`${RELAYED}POST ${HUB_PATHS.desks} answered 200 \\(desk [0-9a-f]+\\)$`,
		'u',
	)
	report.check(
		'the hub logs a relayed open by the id of the desk it opened',
		lines.some(line => opened.test(line)),
	)
	report.check(
		'the hub logs no relayed GET',
		!lines.some(line => line.includes(`${RELAYED}GET `)),
	)
	report.check(
		"the hub logs no request's body (the relayed comment's words)",
		!log.includes(NOTE_PREFIX),
	)
}
