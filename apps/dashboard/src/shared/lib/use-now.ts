import { useSyncExternalStore } from 'react'

import { Temporal } from '@js-temporal/polyfill'

const TICK_MS = 60_000

const listeners = new Set<() => void>()
let now = Temporal.Now.instant()
let ticker: number | undefined

function tick(): void {
	now = Temporal.Now.instant()
	for (const listener of listeners) listener()
}

// One shared minute clock: it runs only while something reads it, and reads fresh when it starts.
function subscribe(listener: () => void): () => void {
	listeners.add(listener)
	if (listeners.size === 1) {
		now = Temporal.Now.instant()
		ticker = window.setInterval(tick, TICK_MS)
	}
	return () => {
		listeners.delete(listener)
		if (listeners.size === 0) window.clearInterval(ticker)
	}
}

function readNow(): Temporal.Instant {
	return now
}

export function useNow(): Temporal.Instant {
	return useSyncExternalStore(subscribe, readNow)
}
