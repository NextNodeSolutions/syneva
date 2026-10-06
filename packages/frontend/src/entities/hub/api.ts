import { ApiError, hubApi } from '@shared/api/client'
import { assertObject, DecodeError, requiredBoolean } from '@shared/api/decode'
import { HUB_PATHS, hubDeskPath, STATIC_PATHS } from '@syneva/contracts/routes'

import { decodeHubDesk, decodeHubDesks, decodeHubHealth } from './decode'
import { decodeJournal } from './journal-decode'

import type { JournalRead } from './journal'
import type { HubDesk, HubHealth, NewDeskInput } from './model'

// The hub entity's API boundary: the only place the hub routes are named. Paths come from
// @contracts/routes so the wire stays in sync with the hub by construction, and every
// response is decoded onto a frontend-owned model here - wire shapes never escape.

// The hub's own pages the dashboard links to: navigations, not requests. Signing in comes
// back to the dashboard.
export const HUB_PAGES = {
	home: STATIC_PATHS.index,
	signOut: HUB_PATHS.logout,
	signIn: `${HUB_PATHS.login}?next=${encodeURIComponent(STATIC_PATHS.index)}`,
} as const

// The poll's reads take a signal: a read the hub never answers is abandoned (a timeout's
// TimeoutError reads as "unreachable" below), not left queued behind the next ones.
export const fetchHubDesks = async (signal?: AbortSignal): Promise<HubDesk[]> =>
	decodeHubDesks(
		await hubApi(HUB_PATHS.desks, { signal: signal ?? null }),
		HUB_PATHS.desks,
	)

export const fetchHubHealth = async (
	signal?: AbortSignal,
): Promise<HubHealth> =>
	decodeHubHealth(
		await hubApi(HUB_PATHS.health, { signal: signal ?? null }),
		HUB_PATHS.health,
	)

// The journal's events after `after` (its whole kept tail when absent), oldest first: the
// dashboard reads the tail once, then only what follows the newest event it holds.
export const fetchHubJournal = async (
	after: number | null,
	signal?: AbortSignal,
): Promise<JournalRead> => {
	const query = after === null ? '' : `?after=${after}`
	return decodeJournal(
		await hubApi(`${HUB_PATHS.journal}${query}`, {
			signal: signal ?? null,
		}),
		HUB_PATHS.journal,
	)
}

// The dashboard's "New review": the same open the CLI performs, answered with the desk to
// navigate to (created, or the live one reloaded). `signal` lets the form abandon an open
// it no longer waits for (the dialog closed while the hub was still opening).
export const openHubDesk = async (
	input: NewDeskInput,
	signal?: AbortSignal,
): Promise<HubDesk> => {
	const raw = await hubApi(HUB_PATHS.desks, {
		method: 'POST',
		body: JSON.stringify(input),
		signal: signal ?? null,
	})
	const o = assertObject(raw, HUB_PATHS.desks)
	if (!requiredBoolean(o, 'ok', HUB_PATHS.desks))
		throw new DecodeError('acknowledgement ok is false', HUB_PATHS.desks)
	return decodeHubDesk(o.desk, HUB_PATHS.desks)
}

// Close a desk: the hub hands its agent the closing (when one is parked on an await) and keeps
// the review saved. Idempotent on the hub; `closed` is false when the desk was already gone.
export const closeHubDesk = async (id: string): Promise<boolean> => {
	const endpoint = hubDeskPath(id)
	const raw = await hubApi(endpoint, { method: 'DELETE' })
	const o = assertObject(raw, endpoint)
	return requiredBoolean(o, 'closed', endpoint)
}

// A 401's stable name in the hub's refusal body; the status alone stands in for a body that is
// not the hub's (a proxy's page).
const UNAUTHORIZED = { status: 401, code: 'UNAUTHORIZED' } as const

// Why a hub request failed, in the terms the dashboard answers in: the hub refused it (with
// its own reason), this browser's sign-in no longer opens the hub, the request was abandoned
// on purpose, the hub answered in a shape this page does not read (a page older than the hub
// it talks to), or no answer came back at all (a timeout included).
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
	if (
		error.code === UNAUTHORIZED.code ||
		error.status === UNAUTHORIZED.status
	)
		return { kind: 'signed-out' }
	return { kind: 'refused', reason: error.message }
}
