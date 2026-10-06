import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchHubDesks, fetchHubHealth, hubRefusal } from './api'
import { pollWhileVisible, READ_TIMEOUT_MS } from './poll'

import type { HubDesk, HubHealth } from './model'

// How the hub last answered: not yet; with a listing; not at all (the last listing, if any,
// is kept); or with a 401, this browser's sign-in no longer opening it.
export type HubStatus = 'connecting' | 'live' | 'unreachable' | 'signed-out'

// How one read came back (a read always comes back with one of these).
type ReadStatus = Exclude<HubStatus, 'connecting'>

// What a poll leaves behind. The four change together, so they live in one state.
type Listing = {
	// The last listing the hub returned; null until the first one lands (the page shows a
	// loading state, not an empty hub).
	desks: HubDesk[] | null
	status: HubStatus
	// When that listing landed (ms since the epoch), null before the first.
	syncedAt: number | null
	// Desks the last listing has that the one before it did not: a row that just arrived.
	// Empty on the first listing, so a page load never reads as a wave of arrivals.
	arrivedIds: ReadonlySet<string>
}

export type HubView = Listing & {
	health: HubHealth | null
	now: number
	refresh: () => Promise<void>
}

const NO_ARRIVALS: ReadonlySet<string> = new Set()

const FIRST_LISTING: Listing = {
	desks: null,
	status: 'connecting',
	syncedAt: null,
	arrivedIds: NO_ARRIVALS,
}

function arrivals(
	previous: HubDesk[] | null,
	next: HubDesk[],
): ReadonlySet<string> {
	if (!previous) return NO_ARRIVALS
	const known = new Set(previous.map(desk => desk.id))
	return new Set(
		next.filter(desk => !known.has(desk.id)).map(desk => desk.id),
	)
}

// A listing that landed: live, stamped, its arrivals named against the one before.
function landed(previous: Listing, desks: HubDesk[]): Listing {
	return {
		desks,
		status: 'live',
		syncedAt: Date.now(),
		arrivedIds: arrivals(previous.desks, desks),
	}
}

// What one read of the listing came back with.
type ListingRead =
	| { kind: 'listed'; desks: HubDesk[] }
	| { kind: 'failed'; status: 'unreachable' | 'signed-out' }

async function readListing(): Promise<ListingRead> {
	try {
		const signal = AbortSignal.timeout(READ_TIMEOUT_MS)
		return { kind: 'listed', desks: await fetchHubDesks(signal) }
	} catch (error) {
		const isSignedOut = hubRefusal(error).kind === 'signed-out'
		return {
			kind: 'failed',
			status: isSignedOut ? 'signed-out' : 'unreachable',
		}
	}
}

// Poll the hub listing (and read its health until it answers). The effect syncs an EXTERNAL
// system - the hub over HTTP on a timer (poll.ts: paused while the tab is hidden, a tick
// skipped while its reads are out, every read abandoned after two cadences) - which is exactly
// what an effect is for. Polling goes on in every status, so a hub started again, or a sign-in
// from another tab, recovers by itself. A close's re-read can still overlap a
// tick's, and the answers can land out of order on separate connections: each read is
// numbered, and one that lands after a newer one was applied is dropped, or a closed row
// would flash back.
export function useHub(): HubView {
	const [listing, setListing] = useState<Listing>(FIRST_LISTING)
	const [health, setHealth] = useState<HubHealth | null>(null)
	const [now, setNow] = useState(() => Date.now())
	const issued = useRef(0)
	const applied = useRef(0)

	// How the hub answered this read.
	const poll = useCallback(async (): Promise<ReadStatus> => {
		issued.current += 1
		const ticket = issued.current
		const read = await readListing()
		const status = read.kind === 'listed' ? 'live' : read.status
		if (ticket < applied.current) return status
		applied.current = ticket
		if (read.kind === 'listed')
			setListing(previous => landed(previous, read.desks))
		else setListing(previous => ({ ...previous, status: read.status }))
		setNow(Date.now())
		return status
	}, [])

	const refresh = useCallback(async (): Promise<void> => {
		await poll()
	}, [poll])

	const loadHealth = useCallback(async (): Promise<boolean> => {
		try {
			setHealth(
				await fetchHubHealth(AbortSignal.timeout(READ_TIMEOUT_MS)),
			)
			return true
		} catch {
			// The header omits Sign out and the footer the version until the hub answers.
			return false
		}
	}, [])

	useEffect(
		() => pollWhileVisible(hubTick(poll, loadHealth)),
		[poll, loadHealth],
	)

	return { ...listing, health, now, refresh }
}

// One tick of the hub's poll: the listing, with `readHealth` riding along until it has
// answered, and again once a poll goes unanswered: the hub may come back restarted - upgraded,
// or with a key it did not have - and its health with it. A 401 is an answer: a signed-out
// hub's health stays read.
function hubTick(
	poll: () => Promise<ReadStatus>,
	readHealth: () => Promise<boolean>,
): () => Promise<void> {
	let hasHealth = false
	const readHealthOnce = async (): Promise<void> => {
		if (hasHealth) return
		hasHealth = await readHealth()
	}
	const pollOnce = async (): Promise<void> => {
		if ((await poll()) === 'unreachable') hasHealth = false
	}
	return async (): Promise<void> => {
		await Promise.all([readHealthOnce(), pollOnce()])
	}
}
