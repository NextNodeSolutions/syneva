import { useEffect, useState } from 'react'

import { fetchHubJournal } from './api'
import { EMPTY_JOURNAL } from './journal'
import { HUB_POLL_MS } from './use-hub'

import type { Journal, JournalRead } from './journal'

// How much of the journal the page keeps: weeks of a busy hub, bounded so a long-open tab
// never grows without end. The hub keeps more; the page reads what its views count.
const KEPT_EVENTS = 2000
// A read the hub has not answered within two cadences is abandoned, as the listing's are.
const READ_TIMEOUT_CADENCES = 2
const READ_TIMEOUT_MS = READ_TIMEOUT_CADENCES * HUB_POLL_MS

// The journal with the events of a read appended (a read only ever brings newer ones). The
// first read is the journal as it stood: none of it counts as arrived.
function appended(
	held: Journal,
	read: JournalRead,
	{ isFirst }: { isFirst: boolean },
): Journal {
	const newest = held.events.at(-1)?.seq ?? 0
	const fresh = read.events.filter(event => event.seq > newest)
	// Nothing new: the journal held stays the same object, so the page does not render again.
	if (!fresh.length) return held.isRead ? held : { ...held, isRead: true }
	let freshAfter: number | null = null
	if (!isFirst) freshAfter = newest
	return {
		events: [...held.events, ...fresh].slice(-KEPT_EVENTS),
		freshAfter,
		isRead: true,
	}
}

type Keep = (update: (held: Journal) => Journal) => void

// Follow the hub's journal into `keep`, on the listing's cadence: the whole kept tail first,
// then only what follows the newest event read. Returns the teardown.
function followJournal(keep: Keep): () => void {
	let after: number | null = null
	let isReading = false
	const read = async (): Promise<void> => {
		if (isReading || document.hidden) return
		isReading = true
		try {
			const next = await fetchHubJournal(
				after,
				AbortSignal.timeout(READ_TIMEOUT_MS),
			)
			const isFirst = after === null
			if (!isFirst && next.latest < (after ?? 0)) {
				// The journal started over (its file removed): read it whole again.
				keep(() => ({ ...EMPTY_JOURNAL, isRead: true }))
				after = null
				return
			}
			keep(held => appended(held, next, { isFirst }))
			after = next.latest
		} catch {
			// Kept as it was, but read: a hub that did not answer has nothing more to say about
			// its history (the listing's poll reports an unreachable hub).
			keep(held => (held.isRead ? held : { ...held, isRead: true }))
		} finally {
			isReading = false
		}
	}
	void read()
	const timer = setInterval(() => void read(), HUB_POLL_MS)
	return (): void => clearInterval(timer)
}

// The hub's journal, read whole once and then followed, paused while the tab is hidden. A
// failed read leaves its events as they were (the listing's own poll says whether the hub
// answers), and still settles the first read.
export function useJournal(): Journal {
	const [journal, setJournal] = useState(EMPTY_JOURNAL)
	// oxlint-disable-next-line nextnode/no-use-effect -- polls the hub over HTTP on a timer: an external system
	useEffect(() => followJournal(setJournal), [])
	return journal
}
