import { printJson } from '../../outbound/console.js'

import { resolveRoot } from './args.js'
import { connectHub, listDesks } from './hub-client.js'

import type { DeskSummary } from '@syneva/contracts/hub'
import type { CliArgs } from './args.js'

export async function runDesks(args: CliArgs): Promise<void> {
	const hub = await connectHub(args, { autostart: false })
	if (!hub) {
		printJson({ ok: false, hub: null, desks: [] })
		return
	}
	let scope: string | undefined
	if (args.all !== true) scope = await resolveRoot(args)
	const desks = await listDesks(hub, scope)
	printJson({
		ok: true,
		hub: hub.url,
		desks: desks.map(desk => withUrl(hub.url, desk)),
	})
}

function withUrl(
	hubUrl: string,
	desk: DeskSummary,
): DeskSummary & { url: string } {
	return { ...desk, url: `${hubUrl}${desk.path.slice(1)}` }
}
