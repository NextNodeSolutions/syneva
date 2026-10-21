import { HUB_PATHS, planPagePath } from '@syneva/contracts/routes'

import { printJson } from '../../outbound/console.js'

import { resolveRoot } from './args.js'
import { connectHub, hubEndpoint, hubGet } from './hub-client.js'
import { readPlans } from './hub-wire.js'

import type { CliArgs } from './args.js'

const HTTP_OK = 200

// The plan library as the agent reads it: this repository's plans (the hub's with --all), each
// with its page on the dashboard. The JSON rides through as the hub wrote it (PlansResponse):
// the CLI only filters and adds the URLs.
export async function runPlans(args: CliArgs): Promise<void> {
	const hub = await connectHub(args, { autostart: false })
	if (!hub) {
		printJson({ ok: false, hub: null, plans: [] })
		return
	}
	const [response, root] = await Promise.all([
		hubGet(hub, HUB_PATHS.plans),
		scopeOf(args),
	])
	const isListed = response.status === HTTP_OK
	const plans = readPlans(isListed ? response.body : null).filter(
		plan => !root || plan.root === root,
	)
	for (const plan of plans)
		plan.url = hubEndpoint(hub.url, planPagePath(plan.id))
	printJson({ ok: isListed, hub: hub.url, plans })
}

// This repository, or every one with --all.
async function scopeOf(args: CliArgs): Promise<string | undefined> {
	if (args.all === true) return undefined
	return resolveRoot(args)
}
