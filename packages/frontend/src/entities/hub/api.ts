import { ApiError, hubApi } from '@shared/api/client'
import { assertObject, DecodeError, requiredBoolean } from '@shared/api/decode'
import {
	HUB_PATHS,
	hubDeskPath,
	JOURNAL_READ_MAX,
	STATIC_PATHS,
} from '@syneva/contracts/routes'

import { decodeHubDesk, decodeHubDesks, decodeHubHealth } from './decode'
import { decodeJournal } from './journal-decode'

import type { JournalRead } from './journal'
import type { HubDesk, HubHealth, NewDeskInput } from './model'

// The only place the hub routes are named: paths come from @contracts/routes so the wire stays in sync with the hub by construction, and every response is decoded onto a frontend-owned model - wire shapes never escape.

export const HUB_PAGES = {
	home: STATIC_PATHS.index,
	signOut: HUB_PATHS.logout,
	signIn: `${HUB_PATHS.login}?next=${encodeURIComponent(STATIC_PATHS.index)}`,
} as const

// A read the hub never answers is abandoned (a timeout's TimeoutError reads as "unreachable" below), not left queued behind the next ones.
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

// The journal's events after `after` (its kept tail when absent), oldest first: the dashboard reads the tail once, then only what follows the newest event it holds.
// Every read asks for the most the hub answers (JOURNAL_READ_MAX): the window the page keeps, so a read capped at it drops nothing the page would hold.
export const fetchHubJournal = async (
	after: number | null,
	signal?: AbortSignal,
): Promise<JournalRead> => {
	const query = new URLSearchParams({ limit: String(JOURNAL_READ_MAX) })
	if (after !== null) query.set('after', String(after))
	return decodeJournal(
		await hubApi(`${HUB_PATHS.journal}?${query}`, {
			signal: signal ?? null,
		}),
		HUB_PATHS.journal,
	)
}

// The dashboard's "New review": the same open the CLI performs, answered with the desk to navigate to (created, or the live one reloaded)
// `signal` lets the form abandon an open it no longer waits for (the dialog closed while the hub was still opening).
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

export const closeHubDesk = async (id: string): Promise<boolean> => {
	const endpoint = hubDeskPath(id)
	const raw = await hubApi(endpoint, { method: 'DELETE' })
	const o = assertObject(raw, endpoint)
	return requiredBoolean(o, 'closed', endpoint)
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
	if (
		error.code === UNAUTHORIZED.code ||
		error.status === UNAUTHORIZED.status
	)
		return { kind: 'signed-out' }
	return { kind: 'refused', reason: error.message }
}
