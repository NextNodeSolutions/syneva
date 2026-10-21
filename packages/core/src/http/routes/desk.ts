import { browserState } from '../../application/browser-state.js'
import {
	deskCapabilities,
	projectFiles,
} from '../../application/capabilities.js'
import { guideAuthoring } from '../../application/guide-authoring.js'
import { buildInventory } from '../../domain/inventory.js'
import { pollPayload } from '../../hub/desk-pulse.js'
import { readJsonBody, json, jsonBody, HTTP_OK } from '../http.js'

import type { BrowserRefreshEvent } from '@syneva/contracts/browser'
import type { RouteRequest } from '../router.js'

// Deprecated for the UI: the hub's stream (GET /api/hub/ws) pushes the same payload as a desk's
// `pulse` frame when it changes (hub/desk-pulse.ts builds both). Kept one release for the CLI and
// for anyone scripting the hub (RFC 0001, 4.6); the browser's 1.5s poll goes with the next change.
export async function servePoll({ ctx, url }: RouteRequest): Promise<Response> {
	// A restarted desk may ship a different state contract: tell an already-loaded tab to refresh its bundle first; legacy clients without an instance token still receive the normal heartbeat.
	const { searchParams } = url
	const instance = searchParams.get('instance')
	if (instance && instance !== ctx.instanceId) {
		const event: BrowserRefreshEvent = { kind: 'refresh' }
		return json(HTTP_OK, { ...event, ...ctx.status() })
	}
	// Keep the 1.5s heartbeat tiny and git-free; file summaries and changes only ride /state.
	return json(HTTP_OK, { ...pollPayload(ctx.state), ...ctx.status() })
}

export async function serveState({ ctx }: RouteRequest): Promise<Response> {
	await ctx.refreshStaged()
	// Revision first, then root: a commit landing between the two reads can only park a body under the OLDER revision (the next read's revision check rejects it) - never a stale body under the newer one.
	// The cached body keys on revision plus transient desk status: only the projection is expensive, and only the status moves between the two reads.
	const status = ctx.status()
	const body = ctx.stateBodyCache.body(
		ctx.revision,
		JSON.stringify({ ...status, serverInstanceId: ctx.instanceId }),
		() =>
			JSON.stringify({
				...browserState(
					ctx.state,
					deskCapabilities(ctx.state, ctx.git),
				),
				...status,
				serverInstanceId: ctx.instanceId,
			}),
	)
	return jsonBody(HTTP_OK, body)
}

// GET /inventory: the live desk's review source as a guide is authored against it (fingerprint, files, units).
export async function serveInventory({ ctx }: RouteRequest): Promise<Response> {
	await ctx.refreshStaged()
	return json(HTTP_OK, buildInventory(ctx.state, ctx.pathFilter))
}

// GET /authoring: what the agent explaining the desk works from - its guide to fill, the domains waiting for words and their code; null on a desk without a guide.
export async function serveAuthoring({ ctx }: RouteRequest): Promise<Response> {
	await ctx.refreshStaged()
	return json(HTTP_OK, guideAuthoring(ctx.state, ctx.pathFilter))
}

export async function serveTree({ ctx }: RouteRequest): Promise<Response> {
	await ctx.refreshStaged()
	return json(HTTP_OK, { files: await projectFiles(ctx.state, ctx.git) })
}

// Stored globally in ~/.syneva/settings.json: the file follows the reviewer across browsers and hosts where a per-origin localStorage would not.
export async function serveSettings({ ctx }: RouteRequest): Promise<Response> {
	return json(HTTP_OK, await ctx.settings.read())
}

export async function saveSettings({
	ctx,
	request,
}: RouteRequest): Promise<Response> {
	const settings: unknown = await readJsonBody(request)
	await ctx.settings.write(settings)
	return json(HTTP_OK, { ok: true })
}
