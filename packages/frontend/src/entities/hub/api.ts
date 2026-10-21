import { ApiError, hubApi } from '@shared/api/client'
import { assertObject, DecodeError, requiredBoolean } from '@shared/api/decode'
import { isWebHubId, WEB_HUB_HEADER } from '@syneva/contracts/bridge'
import {
	HUB_PATHS,
	hubDeskPath,
	hubPlanPath,
	hubPlanStatusPath,
	hubPlanVersionPath,
	STATIC_PATHS,
} from '@syneva/contracts/routes'
import { WEB_HUBS_PREFIX, WEB_PATHS } from '@syneva/contracts/web'

import { decodeHubDesk, decodeHubHealth, decodeWebMe } from './decode'
import { decodeMarkdown, decodePlan, decodePlanDocument } from './plan-decode'
import { localOnlyWords, RELAY_WORDS, relayKindOf } from './relay'

import type { HubDesk, HubHealth, NewDeskInput, WebMe } from './model'
import type { Plan, PlanDocument, PlanStatusChange } from './plan-model'

// The only place the hub routes are named: paths come from @contracts/routes so the wire stays in sync with the hub by construction, and every response is decoded onto a frontend-owned model - wire shapes never escape.
// The listings (desks, journal, plan library) are not read here: the hub's stream carries them (stream.ts).

export const HUB_PAGES = {
	home: STATIC_PATHS.index,
	signOut: HUB_PATHS.logout,
	signIn: `${HUB_PATHS.login}?next=${encodeURIComponent(STATIC_PATHS.index)}`,
} as const

// The web's own pages and routes (apps/web): the form that ends the session posts to the
// first; the other two are the person and a hub's revocation, read and made here.
export const WEB_PAGES = { signOut: WEB_PATHS.logout } as const

// Who is signed in: read once when the Hub page shows it. A 401 is a session that ended.
export const fetchWebMe = async (signal?: AbortSignal): Promise<WebMe> =>
	decodeWebMe(
		await hubApi(WEB_PATHS.me, { signal: signal ?? null }),
		WEB_PATHS.me,
	)

// Revokes one of the person's paired hubs: its socket closes with `revoked`, its token stops
// working, and the web no longer lists it (the page forgets it, stream.ts).
export const revokeWebHub = async (hubId: string): Promise<void> => {
	await hubApi(`${WEB_HUBS_PREFIX}${hubId}`, { method: 'DELETE' })
}

// Read once per hub start (stream.ts, on a hello with a new instance): its access mode, which the
// stream's hello does not carry.
export const fetchHubHealth = async (
	signal?: AbortSignal,
): Promise<HubHealth> =>
	decodeHubHealth(
		await hubApi(HUB_PATHS.health, { signal: signal ?? null }),
		HUB_PATHS.health,
	)

// On the web a hub-level request names no desk, so it names its hub in a header the web reads and
// never forwards (the one place this is set): the hub the person picked, or the one a closed
// desk or a plan belongs to. A local page has one hub and sends nothing.
function hubHeader(hubId: string | undefined): Record<string, string> {
	const headers: Record<string, string> = {}
	if (hubId && isWebHubId(hubId)) headers[WEB_HUB_HEADER] = hubId
	return headers
}

export type OpenOptions = {
	// The hub to open the desk on.
	hubId?: string | undefined
	// Lets the form abandon an open it no longer waits for (the dialog closed while the hub was
	// still opening).
	signal?: AbortSignal | undefined
}

// The dashboard's "New review": the same open the CLI performs, answered with the desk to navigate to (created, or the live one reloaded).
export const openHubDesk = async (
	input: NewDeskInput,
	{ hubId, signal }: OpenOptions = {},
): Promise<HubDesk> => {
	const raw = await hubApi(HUB_PATHS.desks, {
		method: 'POST',
		body: JSON.stringify(input),
		signal: signal ?? null,
		headers: hubHeader(hubId),
	})
	const o = assertObject(raw, HUB_PATHS.desks)
	if (!requiredBoolean(o, 'ok', HUB_PATHS.desks))
		throw new DecodeError('acknowledgement ok is false', HUB_PATHS.desks)
	return decodeHubDesk(o.desk, HUB_PATHS.desks, hubId)
}

export const closeHubDesk = async (id: string): Promise<boolean> => {
	const endpoint = hubDeskPath(id)
	const raw = await hubApi(endpoint, { method: 'DELETE' })
	const o = assertObject(raw, endpoint)
	return requiredBoolean(o, 'closed', endpoint)
}

// The plan library's texts: one plan with its latest version's markdown (read when the stream
// says the plan moved to a new version), an earlier version's, and the status the reviewer sets
// by hand. The records themselves ride the stream's `plan` frames.
const NOT_FOUND = 404

// Null when the hub keeps no plan with this id: the page says so rather than failing.
export const fetchPlan = async (
	id: string,
	signal?: AbortSignal,
): Promise<PlanDocument | null> => {
	const endpoint = hubPlanPath(id)
	try {
		return decodePlanDocument(
			await hubApi(endpoint, { signal: signal ?? null }),
			endpoint,
		)
	} catch (error) {
		if (error instanceof ApiError && error.status === NOT_FOUND) return null
		throw error
	}
}

export const fetchPlanVersion = async (
	id: string,
	version: number,
	signal?: AbortSignal,
): Promise<string> => {
	const endpoint = hubPlanVersionPath(id, version)
	return decodeMarkdown(
		await hubApi(endpoint, { signal: signal ?? null }),
		endpoint,
	)
}

export const changePlanStatus = async (
	id: string,
	status: PlanStatusChange,
): Promise<Plan> => {
	const endpoint = hubPlanStatusPath(id)
	const raw = await hubApi(endpoint, {
		method: 'POST',
		body: JSON.stringify({ status }),
	})
	return decodePlan(assertObject(raw, endpoint, 'plan status').plan, endpoint)
}

// The status alone stands in for a body that is not the hub's (a proxy's page).
const UNAUTHORIZED = { status: 401, code: 'UNAUTHORIZED' } as const

export type HubRefusal =
	| { kind: 'refused'; reason: string }
	| { kind: 'signed-out' }
	| { kind: 'aborted' }
	| { kind: 'unreadable' }
	| { kind: 'unreachable' }

export function hubRefusal(error: unknown): HubRefusal {
	if (error instanceof DOMException && error.name === 'AbortError')
		return { kind: 'aborted' }
	if (error instanceof DecodeError) return { kind: 'unreadable' }
	if (!(error instanceof ApiError)) return { kind: 'unreachable' }
	// The web could not carry the request to the hub: its words, not the web's status line.
	const relay = relayKindOf(error)
	if (relay) return { kind: 'refused', reason: RELAY_WORDS[relay] }
	if (
		error.code === UNAUTHORIZED.code ||
		error.status === UNAUTHORIZED.status
	)
		return { kind: 'signed-out' }
	// What the hub keeps for its machine: its sentence, then what to do instead.
	const instead = localOnlyWords(error)
	if (instead)
		return { kind: 'refused', reason: `${error.message} ${instead}` }
	return { kind: 'refused', reason: error.message }
}

// A refusal as the reviewer reads it beside the control that met it: the hub's own reason, a
// signed-out browser, or `unanswered` (the hub did not answer, or its answer did not read).
export function refusalMessage(
	error: unknown,
	unanswered = 'The hub did not answer.',
): string {
	const refusal = hubRefusal(error)
	if (refusal.kind === 'refused') return refusal.reason
	if (refusal.kind === 'signed-out') return 'This browser is signed out.'
	return unanswered
}
