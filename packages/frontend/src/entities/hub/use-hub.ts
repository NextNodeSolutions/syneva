import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchHubDesks, fetchHubHealth, hubRefusal } from './api'
import { pollWhileVisible, READ_TIMEOUT_MS } from './poll'

import type { HubDesk, HubHealth } from './model'

export type HubStatus = 'connecting' | 'live' | 'unreachable' | 'signed-out'

type ReadStatus = Exclude<HubStatus, 'connecting'>

type Listing = {
	desks: HubDesk[] | null
	status: HubStatus
	syncedAt: number | null
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
	const arrived = next.filter(desk => !known.has(desk.id))
	return arrived.length ? new Set(arrived.map(desk => desk.id)) : NO_ARRIVALS
}

function landed(previous: Listing, desks: HubDesk[]): Listing {
	return {
		desks,
		status: 'live',
		syncedAt: Date.now(),
		arrivedIds: arrivals(previous.desks, desks),
	}
}

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

export function useHub(): HubView {
	const [listing, setListing] = useState<Listing>(FIRST_LISTING)
	const [health, setHealth] = useState<HubHealth | null>(null)
	const [now, setNow] = useState(() => Date.now())
	const issued = useRef(0)
	const applied = useRef(0)

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
			return false
		}
	}, [])

	useEffect(
		() => pollWhileVisible(hubTick(poll, loadHealth)),
		[poll, loadHealth],
	)

	return { ...listing, health, now, refresh }
}

// One tick of the hub's poll: the listing, with `readHealth` riding along until it has answered, and again once a poll goes unanswered.
// The hub may come back restarted - upgraded, or with a key it did not have - and a 401 is an answer: a signed-out hub's health stays read.
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
