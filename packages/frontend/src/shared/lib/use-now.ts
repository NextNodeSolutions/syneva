import { useSyncExternalStore } from 'react'

// The clock the words that age read ("12s ago", "waiting 4m", "retrying in 8s"): one interval
// for every reader on the page, running while one is mounted and the page is shown. It re-reads
// Date.now() and nothing else; no request rides it (the hub's own news arrives on its stream).
// Coarse on purpose: the words it feeds change by the second at the finest.
const CLOCK_TICK_MS = 2000

let now = Date.now()
const readers = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function tick(): void {
	now = Date.now()
	for (const reader of readers) reader()
}

function start(): void {
	if (timer || document.hidden) return
	timer = setInterval(tick, CLOCK_TICK_MS)
}

function stop(): void {
	clearInterval(timer)
	timer = undefined
}

// A hidden page stops its clock; shown again, it reads the time at once.
function onVisibility(): void {
	if (document.hidden) {
		stop()
		return
	}
	tick()
	start()
}

function subscribe(reader: () => void): () => void {
	if (!readers.size) {
		now = Date.now()
		document.addEventListener('visibilitychange', onVisibility)
		start()
	}
	readers.add(reader)
	return () => {
		readers.delete(reader)
		if (readers.size) return
		document.removeEventListener('visibilitychange', onVisibility)
		stop()
	}
}

function readNow(): number {
	return now
}

export function useNow(): number {
	return useSyncExternalStore(subscribe, readNow)
}
