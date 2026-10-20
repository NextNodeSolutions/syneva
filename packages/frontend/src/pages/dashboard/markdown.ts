import { useSyncExternalStore } from 'react'

import { configureMarkdownRuntime } from '@shared/markdown/runtime-config'

import { keptCodeTheme } from './code-theme'

import type * as MarkdownEngine from '@shared/markdown/engine'

export type PlanMarkdown = typeof MarkdownEngine

// The dashboard renders markdown on one page (a plan), which loads the renderer itself: the
// desk's own front to it stays out of the dashboard, so neither page's cold open carries the
// other's. Readers re-render when a lazily loaded grammar repaints a code block.
const readers = new Set<() => void>()
let revision = 0
let loading: Promise<PlanMarkdown | null> | undefined

function repaint(): void {
	revision += 1
	for (const reader of readers) reader()
}

async function loadEngine(): Promise<PlanMarkdown> {
	const theme = keptCodeTheme() || 'pierre-light'
	configureMarkdownRuntime({
		getTheme: () => theme,
		onLoaded: repaint,
		onLoadError: () => {},
		repoImageSrc: src => src,
	})
	const engine = await import('@shared/markdown/engine')
	await engine.initializeMarkdown(theme)
	return engine
}

// One load per page life, shared by every reader; a failed load is tried again on the next
// page that asks. It settles on null rather than rejecting: a reader suspends on it with no
// error boundary above, so a rejection would unmount the whole dashboard.
async function loadOnce(): Promise<PlanMarkdown | null> {
	try {
		return await loadEngine()
	} catch {
		loading = undefined
		return null
	}
}

export function planMarkdown(): Promise<PlanMarkdown | null> {
	loading ??= loadOnce()
	return loading
}

function subscribe(reader: () => void): () => void {
	readers.add(reader)
	return () => readers.delete(reader)
}

// Changes when the renderer's output does (a grammar loaded): a reader renders again.
export function useMarkdownRevision(): number {
	return useSyncExternalStore(subscribe, () => revision)
}
