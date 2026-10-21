import { useSyncExternalStore } from 'react'

import { hubView, subscribeHub } from './stream'

import type { Journal } from './journal'

function readJournal(): Journal {
	return hubView().journal.journal
}

// The hub's journal as its stream brings it: the snapshot's tail, then every event as the hub
// records it, deduplicated across reconnects (journal-follow.ts).
export function useJournal(): Journal {
	return useSyncExternalStore(subscribeHub, readJournal)
}
