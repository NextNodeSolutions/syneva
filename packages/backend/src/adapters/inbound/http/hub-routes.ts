import { HUB_PATHS, JOURNAL_READ_MAX } from '@syneva/contracts/routes'

import {
	HTTP_NOT_FOUND,
	HTTP_OK,
	HTTP_UNPROCESSABLE,
	readJsonBody,
	json,
	fail,
} from './http.js'
import { parseOpenRequest } from './open-request.js'

import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
	CloseDeskResponse,
	HubDesksResponse,
	HubHealth,
	OpenDeskResponse,
} from '@syneva/contracts/hub'
import type { HubJournal, JournalQuery } from '../../../application/journal.js'
import type { SettingsPort } from '../../../application/ports.js'
import type { ApiFailure } from './failure.js'
import type { Hub } from './hub.js'

export type HubRouteDeps = {
	hub: Hub
	journal: HubJournal
	settings: SettingsPort
	version: string
	keyRequired: boolean
	onShutdown: () => void
}

// What an agent does next, by refusal; a code without its own line gets the generic repo-state fix.
const OPEN_FIXES: Record<string, string> = {
	INVALID_GUIDE:
		'Fix the guide fields named above (`syneva spec`, The guide), then open again.',
}

export const DESK_NOT_FOUND: ApiFailure = {
	status: HTTP_NOT_FOUND,
	code: 'DESK_NOT_FOUND',
	error: 'No live desk with that id on this hub.',
	fix: 'List desks with GET /api/hub/desks, or open one with `syneva open`.',
}

export function hubHealth(deps: HubRouteDeps, res: ServerResponse): void {
	const health: HubHealth = {
		ok: true,
		version: deps.version,
		instanceId: deps.hub.instanceId,
		startedAt: deps.hub.startedAt,
		desks: deps.hub.listDesks().length,
		keyRequired: deps.keyRequired,
	}
	json(res, HTTP_OK, health)
}

export function listDesks(
	deps: HubRouteDeps,
	res: ServerResponse,
	url: URL,
): void {
	const root = url.searchParams.get('root')
	const session = url.searchParams.get('session')
	const desks = deps.hub
		.listDesks()
		.filter(desk => !root || desk.record.root === root)
		.filter(desk => !session || desk.record.session === session)
		.map(desk => deps.hub.summary(desk))
		.toSorted((a, b) => b.openedAt.localeCompare(a.openedAt))
	const response: HubDesksResponse = { desks }
	json(res, HTTP_OK, response)
}

export async function openDeskRoute(
	deps: HubRouteDeps,
	req: IncomingMessage,
	res: ServerResponse,
): Promise<void> {
	const parsed = parseOpenRequest(await readJsonBody(req))
	if ('error' in parsed)
		return fail(res, {
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_OPEN',
			error: parsed.error,
			fix: 'POST { root, mode?, session?, target?, base?, staged?, path?, guide? } - see `syneva spec`.',
		})
	const outcome = await deps.hub.openDesk(parsed.query, parsed.guide)
	if (!outcome.ok)
		return fail(res, {
			status: HTTP_UNPROCESSABLE,
			code: outcome.code,
			error: outcome.reason,
			fix:
				OPEN_FIXES[outcome.code] ??
				'Fix the repo state named above, then open the desk again.',
		})
	const response: OpenDeskResponse = {
		ok: true,
		desk: deps.hub.summary(outcome.desk),
		outcome: outcome.outcome,
	}
	json(res, HTTP_OK, response)
}

// POST /api/hub/inventory: the review source for an open's parameters (same body, no guide), before any desk opens.
export async function inventoryRoute(
	deps: HubRouteDeps,
	req: IncomingMessage,
	res: ServerResponse,
): Promise<void> {
	const parsed = parseOpenRequest(await readJsonBody(req))
	if ('error' in parsed)
		return fail(res, {
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_INVENTORY',
			error: parsed.error,
			fix: 'POST { root, mode?, session?, target?, base?, staged?, path? } - see `syneva spec`.',
		})
	const outcome = await deps.hub.inventory(parsed.query)
	if (!outcome.ok)
		return fail(res, {
			status: HTTP_UNPROCESSABLE,
			code: outcome.code,
			error: outcome.reason,
			fix: 'Fix the repo state named above, then ask for the inventory again.',
		})
	json(res, HTTP_OK, outcome.inventory)
}

export function readDesk(
	deps: HubRouteDeps,
	res: ServerResponse,
	id: string,
): void {
	const desk = deps.hub.getDesk(id)
	if (!desk) return fail(res, DESK_NOT_FOUND)
	json(res, HTTP_OK, { desk: deps.hub.summary(desk) })
}

// Idempotent: closing an already-gone desk answers { closed: false } with 200, so an agent can close unconditionally when its round settles.
export function closeDeskRoute(
	deps: HubRouteDeps,
	res: ServerResponse,
	id: string,
): void {
	const response: CloseDeskResponse = {
		ok: true,
		closed: deps.hub.closeDesk(id),
		id,
	}
	json(res, HTTP_OK, response)
}

// GET /api/hub/journal[?after=<seq>][&limit=<n>] - what happened on the hub (HubJournalResponse).
export async function readJournal(
	deps: HubRouteDeps,
	res: ServerResponse,
	url: URL,
): Promise<void> {
	const query = parseJournalQuery(url.searchParams)
	if ('error' in query)
		return fail(res, {
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_JOURNAL_QUERY',
			error: query.error,
			fix: `GET ${HUB_PATHS.journal}[?after=<seq>][&limit=<1-${JOURNAL_READ_MAX}>], both non-negative integers.`,
		})
	json(res, HTTP_OK, await deps.journal.read(query))
}

// The display preferences (~/.syneva/settings.json), read and written exactly as a desk's
// /settings routes do (routes/desk.ts): the dashboard has no desk base to reach them under.
export async function serveHubSettings(
	deps: HubRouteDeps,
	res: ServerResponse,
): Promise<void> {
	json(res, HTTP_OK, await deps.settings.read())
}

export async function saveHubSettings(
	deps: HubRouteDeps,
	req: IncomingMessage,
	res: ServerResponse,
): Promise<void> {
	const settings: unknown = await readJsonBody(req)
	await deps.settings.write(settings)
	json(res, HTTP_OK, { ok: true })
}

export function shutdownHub(deps: HubRouteDeps, res: ServerResponse): void {
	res.on('finish', () => deps.onShutdown())
	json(res, HTTP_OK, { ok: true, stopping: true })
}

// A read that names no limit (an agent's curl) gets a page of recent events; the dashboard asks
// for JOURNAL_READ_MAX, the window it keeps.
const JOURNAL_DEFAULT_LIMIT = 500
const COUNT_PARAM = /^\d+$/

// `after` defaults to 0 (seqs start at 1, so: everything kept); `limit` is clamped into
// 1..JOURNAL_READ_MAX. Either one present but not a non-negative integer is refused.
function parseJournalQuery(
	params: URLSearchParams,
): JournalQuery | { error: string } {
	const after = params.get('after')
	const limit = params.get('limit')
	if (after !== null && !COUNT_PARAM.test(after))
		return {
			error: '`after` must be a non-negative integer (a journal seq).',
		}
	if (limit !== null && !COUNT_PARAM.test(limit))
		return { error: '`limit` must be a non-negative integer.' }
	return {
		after: Number(after ?? 0),
		limit: Math.min(
			Math.max(Number(limit ?? JOURNAL_DEFAULT_LIMIT), 1),
			JOURNAL_READ_MAX,
		),
	}
}
