import { useSyncExternalStore } from 'react'

import { markdownRevision } from './index'

// For a React page that renders markdown outside the desk's store (the hub's plan page): it
// renders again when the engine lands or repaints (a grammar loaded). The page's app wires
// repaintMarkdownReaders as the runtime's onLoaded; a burst of repaints (several grammars
// landing together) reaches the readers once, on the next frame.
const readers = new Set<() => void>()
let frame = 0

export function repaintMarkdownReaders(): void {
	if (frame) return
	frame = requestAnimationFrame(() => {
		frame = 0
		for (const reader of readers) reader()
	})
}

function subscribe(reader: () => void): () => void {
	readers.add(reader)
	return () => readers.delete(reader)
}

export function useMarkdownRevision(): number {
	return useSyncExternalStore(subscribe, markdownRevision)
}
