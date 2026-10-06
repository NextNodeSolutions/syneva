import { perfMark } from '@shared/lib/perf'

import { fetchFileContents } from './api'

import type { PreviewFile, ReviewFile } from '../model'

type ReviewFileT = ReviewFile

// Per-file old/new contents fetched on demand (the render path reads no embedded copies off the polled ReviewState); the client-side LRU matches the render instance cache so re-opening a visited file re-renders without a round-trip.
// Preview files carry contents inline, not here.

type Contents = { oldContents: string; newContents: string }

const CACHE_CAP = 30
// Keyed path + contentHash: a reload that rewrites a file changes its hash, so the stale entry falls out on its own (mirrors the server-side cache token).
const cache = new Map<string, Contents>()
const cacheKey = (f: ReviewFileT): string => `${f.path}\0${f.contentHash}`

export const cur: {
	path: string | null
	oldContents: string
	newContents: string
} = {
	path: null,
	oldContents: '',
	newContents: '',
}

export function peekContents(
	f: ReviewFileT,
	preview: PreviewFile | null,
): Contents | null {
	if (preview && f === preview)
		return {
			oldContents: preview.previewContents,
			newContents: preview.previewContents,
		}
	return cache.get(cacheKey(f)) ?? null
}

async function fetchContents(f: ReviewFileT): Promise<Contents> {
	const key = cacheKey(f)
	const hit = cache.get(key)
	if (hit) {
		cache.delete(key) // re-insert → most-recently-used
		cache.set(key, hit)
		return hit
	}
	const started = performance.now()
	const r = await fetchFileContents(f.path)
	perfMark('contents:loaded', {
		ms: Math.round(performance.now() - started),
		bytes: r.oldContents?.length ?? 0,
	})
	const val = { oldContents: r.oldContents, newContents: r.newContents }
	cache.set(key, val)
	while (cache.size > CACHE_CAP) {
		const oldest = cache.keys().next()
		if (oldest.done) break
		cache.delete(oldest.value)
	}
	return val
}

// Warm the NEXT file's contents into the same LRU the real open reads, fire-and-forget - it never
// touches `cur`, so a late prefetch can't clobber the current render; skips oversized placeholders
// and cache hits; at most one in flight; a failure is swallowed (the real open re-fetches).
let isPrefetching = false

async function prefetch(f: ReviewFileT): Promise<void> {
	try {
		await fetchContents(f)
	} catch {
		/* a failed warm-up is silent: the real open re-fetches and renders the error card */
	} finally {
		isPrefetching = false
	}
}

export async function prefetchContents(
	f: ReviewFileT | null | undefined,
	loadedOversized: Set<string>,
): Promise<void> {
	if (!f || isPrefetching) return
	if (f.oversized && !loadedOversized.has(f.path)) return
	if (cache.has(cacheKey(f))) return
	isPrefetching = true
	await prefetch(f)
}

// Returns "ok", "error", or "stale" when the reviewer switched files mid-fetch (a newer render for
// the now-current file is already running). The stale guard pins the in-flight request to its
// file: a late response must never render into, or seed `cur` for, the wrong file; stillCurrent()
// re-reads the store at await-resume time.
export async function loadCurrentContents(
	file: ReviewFileT | null,
	preview: PreviewFile | null,
	stillCurrent: () => boolean,
): Promise<'ok' | 'stale' | 'error'> {
	if (!file) {
		cur.path = null
		cur.oldContents = ''
		cur.newContents = ''
		return 'ok'
	}
	const f = file
	if (preview && f === preview) {
		cur.path = f.path
		cur.oldContents = preview.previewContents
		cur.newContents = preview.previewContents
		return 'ok'
	}
	try {
		const { oldContents, newContents } = await fetchContents(f)
		if (!stillCurrent()) return 'stale' // switch files mid-fetch - drop this pass
		cur.path = f.path
		cur.oldContents = oldContents
		cur.newContents = newContents
		return 'ok'
	} catch {
		if (!stillCurrent()) return 'stale'
		return 'error'
	}
}

export function currentSplittable(f: ReviewFileT | null | undefined): boolean {
	if (!f) return true
	if (cur.path !== f.path) return true
	const o = cur.oldContents,
		n = cur.newContents
	return o !== '' && n !== '' && o !== n
}
