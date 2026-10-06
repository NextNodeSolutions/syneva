import { relativeTime } from '../format'

import type { HubPlace } from '@entities/hub/hub-place'
import type { DeskClosed } from '@entities/hub/journal'

// What the empty overview says under its title: on a fresh hub, who opens a desk and where (a
// hub reached over the network is on another machine); once desks have closed, when the last
// one did and that it comes back with its verdicts. While the hub is not answering, when new
// desks will show.
const FRESH: Record<HubPlace, string> = {
	loopback:
		'Your agent opens a desk in its repository when it has changes for you. Run the same command there yourself, or start a review from here.',
	network:
		"Your agent opens a desk in its repository, on the hub's machine, when it has changes for you. Run the same command there yourself, or start a review from here.",
}

const STALE = 'New desks show up here once the hub answers again.'

type LedeFacts = {
	place: HubPlace
	lastClosed: DeskClosed | null
	now: number
	isStale: boolean
}

export function heroLede({ place, lastClosed, now, isStale }: LedeFacts): {
	lead: string
	after: string
} {
	const lead = lastClosed
		? `The last desk closed ${relativeTime(lastClosed.at, now)}. Reopen one below with its verdicts, or open a new one.`
		: FRESH[place]
	return { lead, after: isStale ? STALE : '' }
}
