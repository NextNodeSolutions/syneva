import { validateGuide } from '../../../domain/guide.js'

import {
	HTTP_NOT_FOUND,
	HTTP_OK,
	HTTP_UNPROCESSABLE,
	readJsonBody,
	json,
	fail,
} from './http.js'

import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
	CloseDeskResponse,
	HubDesksResponse,
	HubHealth,
	OpenDeskResponse,
} from '@syneva/contracts/hub'
import type { ReviewMode } from '@syneva/contracts/review'
import type { DeskQuery } from '../../../application/open-desk.js'
import type { Guide } from '../../../domain/review.js'
import type { ApiFailure } from './failure.js'
import type { Hub } from './hub.js'

// The hub's own API: liveness, the desk registry (list / open / read / close) and the hub
// shutdown. Transport decode lives here; the hub decides.
export type HubRouteDeps = {
	hub: Hub
	version: string
	keyRequired: boolean
	onShutdown: () => void
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

// GET /api/hub/desks[?root=<abs path>][&session=<id>] - every live desk, newest first, narrowed
// to one repo (the CLI's auto-targeting) and optionally one session.
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
			fix: 'Fix the repo state named above, then open the desk again.',
		})
	const response: OpenDeskResponse = {
		ok: true,
		desk: deps.hub.summary(outcome.desk),
		outcome: outcome.outcome,
	}
	json(res, HTTP_OK, response)
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

// Idempotent: closing a desk that is already gone answers { closed: false } with 200, so an
// agent can close unconditionally when its round settles.
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

export function shutdownHub(deps: HubRouteDeps, res: ServerResponse): void {
	res.on('finish', () => deps.onShutdown())
	json(res, HTTP_OK, { ok: true, stopping: true })
}

type ParsedOpen =
	| { query: DeskQuery; guide: Guide | undefined }
	| { error: string }

function isMode(raw: unknown): raw is ReviewMode {
	return raw === 'repo' || raw === 'file' || raw === 'pr'
}

function optionalText(
	record: Record<string, unknown>,
	key: string,
): string | undefined {
	const field = record[key]
	if (typeof field !== 'string' || !field.length) return undefined
	return field
}

// The open body, shaped field by field: `root` is required; the mode defaults to repo; a
// present `guide` is validated by the domain rule (a bad grouping is refused before any desk
// is touched, exactly like the CLI's --guide check).
function parseOpenRequest(body: unknown): ParsedOpen {
	if (typeof body !== 'object' || body === null)
		return { error: 'The open body must be a JSON object.' }
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(body),
	)
	const root = optionalText(record, 'root')
	if (!root) return { error: 'open requires a non-empty `root` path.' }
	const mode = record.mode ?? 'repo'
	if (!isMode(mode)) return { error: 'mode must be "repo", "file" or "pr".' }
	const target = optionalText(record, 'target')
	if (mode === 'file' && !target)
		return { error: 'file mode requires `target` (the file to review).' }
	let guide: Guide | undefined
	// A posted `guide` key is a posted guide, null included: it is validated, never ignored.
	if ('guide' in record) {
		const validation = validateGuide(record.guide)
		if (!validation.ok)
			return { error: `Invalid guide: ${validation.reason}.` }
		guide = validation.guide
	}
	return {
		query: {
			root,
			mode,
			session: optionalText(record, 'session'),
			target,
			base: optionalText(record, 'base'),
			staged: record.staged === true,
			pathFilter: optionalText(record, 'path'),
		},
		guide,
	}
}
