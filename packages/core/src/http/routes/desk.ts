import { browserState } from '../../application/browser-state.js'
import {
	deskCapabilities,
	projectFiles,
} from '../../application/capabilities.js'
import { guideAuthoring } from '../../application/guide-authoring.js'
import { buildInventory } from '../../domain/inventory.js'
import { deskPulse, pollPayload } from '../../hub/desk-pulse.js'
import { readJsonBody, json, jsonBody, HTTP_OK } from '../http.js'
import { settingsFor } from '../settings.js'

import type { BrowserRefreshEvent } from '@syneva/contracts/browser'
import type { RouteRequest } from '../router.js'

// Deprecated for the UI: the hub's stream (GET /api/hub/ws) pushes the same payload as a desk's
// `pulse` frame when it changes (hub/desk-pulse.ts builds both; past a frame's bound the frame is
// partial and GET /pulse serves it whole). Kept one release for the CLI and for anyone scripting
// the hub (RFC 0001, 4.6); the browser's 1.5s poll goes with the next change.
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

// GET /pulse: the desk's pulse whole, as a stream's `pulse` frame carries it when it fits. A tab
// reads it when a frame brings a partial pulse whose digest it has not read yet (the parts left
// out moved): pushed by the frame, never on a timer.
export async function servePulse({ ctx }: RouteRequest): Promise<Response> {
	return json(HTTP_OK, deskPulse(ctx))
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
// A relayed request never reads or writes the machine's own keys (http/settings.ts).
export async function serveSettings({
	ctx,
	channel,
}: RouteRequest): Promise<Response> {
	return json(HTTP_OK, await settingsFor(ctx.settings, channel).read())
}

export async function saveSettings({
	ctx,
	request,
	channel,
}: RouteRequest): Promise<Response> {
	const settings: unknown = await readJsonBody(request)
	await settingsFor(ctx.settings, channel).write(settings)
	return json(HTTP_OK, { ok: true })
}
