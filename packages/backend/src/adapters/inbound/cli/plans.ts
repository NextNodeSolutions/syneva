import { HUB_PATHS, planPagePath } from '@syneva/contracts/routes'

import { printJson } from '../../outbound/console.js'

import { resolveRoot } from './args.js'
import { connectHub, hubGet } from './hub-client.js'

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
	const response = await hubGet(hub, HUB_PATHS.plans)
	const root = await scopeOf(args)
	const isListed = response.status === HTTP_OK
	const plans = plansOf(isListed ? response.body : null).filter(
		plan => !root || plan.root === root,
	)
	for (const plan of plans)
		plan.url = `${hub.url}${planPagePath(plan.id).slice(1)}`
	printJson({ ok: isListed, hub: hub.url, plans })
}

// This repository, or every one with --all.
async function scopeOf(args: CliArgs): Promise<string | undefined> {
	if (args.all === true) return undefined
	return resolveRoot(args)
}

type ListedPlan = Record<string, unknown> & {
	id: string
	root: string
	url?: string
}

// The fields the CLI acts on are checked; the rest of each plan rides along untouched.
function plansOf(body: unknown): ListedPlan[] {
	if (typeof body !== 'object' || body === null || !('plans' in body))
		return []
	const { plans } = body
	if (!Array.isArray(plans)) return []
	return plans.flatMap(entry => {
		if (typeof entry !== 'object' || entry === null) return []
		const plan: Record<string, unknown> = Object.fromEntries(
			Object.entries(entry),
		)
		const { id, root } = plan
		if (typeof id !== 'string' || typeof root !== 'string') return []
		return [{ ...plan, id, root }]
	})
}
