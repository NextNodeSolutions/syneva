import { browserState } from '../../../../application/browser-state.js'
import { buildInventory } from '../../../../domain/inventory.js'
import { readJsonBody, json, jsonBody, HTTP_OK } from '../http.js'

import type {
	BrowserRefreshEvent,
	PollPayload,
} from '@syneva/contracts/browser'
import type { RouteRequest } from '../router.js'

export async function servePoll({
	ctx,
	res,
	url,
}: RouteRequest): Promise<void> {
	// A restarted desk may ship a different state contract: tell an already-loaded tab to refresh its bundle first; legacy clients without an instance token still receive the normal heartbeat.
	const { searchParams } = url
	const instance = searchParams.get('instance')
	if (instance && instance !== ctx.instanceId) {
		const event: BrowserRefreshEvent = { kind: 'refresh' }
		json(res, HTTP_OK, { ...event, ...ctx.status() })
		return
	}
	// Keep the 1.5s heartbeat tiny and git-free; file summaries and changes only ride /state.
	// One capture: the three review fields must come from one state root - a commit landing mid-build would stitch the poll from two revisions.
	const { state } = ctx
	const poll: PollPayload = {
		baseDiffHash: state.baseDiffHash,
		guide: state.guide,
		guideResolution: state.guideResolution,
		comments: state.comments,
	}
	json(res, HTTP_OK, { ...poll, ...ctx.status() })
}

export async function serveState({ ctx, res }: RouteRequest): Promise<void> {
	await ctx.refreshStaged()
	// Revision first, then root: a commit landing between the two reads can only park a body under the OLDER revision (the next read's revision check rejects it) - never a stale body under the newer one.
	// The cached body keys on revision plus transient desk status: only the projection is expensive, and only the status moves between the two reads.
	const status = ctx.status()
	const body = ctx.stateBodyCache.body(
		ctx.revision,
		JSON.stringify({ ...status, serverInstanceId: ctx.instanceId }),
		() =>
			JSON.stringify({
				...browserState(ctx.state),
				...status,
				serverInstanceId: ctx.instanceId,
			}),
	)
	jsonBody(res, HTTP_OK, body)
}

// GET /inventory: the live desk's review source as a guide is authored against it (fingerprint, files, units).
export async function serveInventory({
	ctx,
	res,
}: RouteRequest): Promise<void> {
	await ctx.refreshStaged()
	json(res, HTTP_OK, buildInventory(ctx.state, ctx.pathFilter))
}

export async function serveTree({ ctx, res }: RouteRequest): Promise<void> {
	await ctx.refreshStaged()
	json(res, HTTP_OK, { files: await ctx.git.projectTree(ctx.state.root) })
}

// Stored globally in ~/.syneva/settings.json: the file follows the reviewer across browsers and hosts where a per-origin localStorage would not.
export async function serveSettings({ ctx, res }: RouteRequest): Promise<void> {
	json(res, HTTP_OK, await ctx.settings.read())
}

export async function saveSettings({
	ctx,
	req,
	res,
}: RouteRequest): Promise<void> {
	const settings: unknown = await readJsonBody(req)
	await ctx.settings.write(settings)
	json(res, HTTP_OK, { ok: true })
}
