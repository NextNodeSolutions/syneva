import { getFiletypeFromFileName } from '@pierre/diffs'
import { getOrCreateWorkerPoolSingleton } from '@pierre/diffs/worker'

import type { Settings } from '@entities/settings/model'
import type { LineDiffTypes } from '@pierre/diffs'
import type { WorkerPoolManager } from '@pierre/diffs/worker'

// Pierre's highlight worker pool. Tokenizing runs off the main thread: a diff Pierre has not
// highlighted yet paints plain rows at once (its plain AST) and its colors land when a worker
// finishes, so neither a cold open, a file switch nor a decision blocks the page. Highlighted
// results are cached by the diff's cacheKey across instances (diff-metadata.ts), so a revisited
// file colors from the cache. Two workers: the desk shows one file at a time, so a second only
// overlaps a prefetch with the visible file, and every extra worker is one more boot competing
// with the cold open.
const POOL_SIZE = 2

// The render options the pool owns - in pool mode Pierre highlights with these, not with the
// instance's own theme/lineDiffType options. The oniguruma engine tokenizes ~35% faster than the
// JS regex engine on TypeScript, and its wasm only loads inside the workers.
export type PoolRenderOptions = {
	theme: { dark: string; light: string }
	lineDiffType: LineDiffTypes
}

export function poolRenderOptions(
	settings: Pick<Settings, 'theme' | 'lineDiffType'>,
): PoolRenderOptions {
	return {
		theme: { dark: settings.theme, light: settings.theme },
		lineDiffType: settings.lineDiffType,
	}
}

// The options last handed to the pool, so a pass only pushes a real change.
let pushedOptions: string | null = null

// The languages of the files the desk opens on, resolved while the pool boots (Pierre's
// highlighterOptions.langs): the first highlight then skips its grammar fetch. Only those files'
// - every extra grammar delays the boot, and with it the first plain paint.
function preloadLanguages(paths: string[]): string[] {
	return [...new Set(paths.map(path => getFiletypeFromFileName(path)))]
}

// The singleton: the first call boots the workers with these options (main.tsx calls it as soon
// as the review is known, so the boot overlaps the first contents fetch). Every later call returns
// it and syncs a changed theme or line-diff mode through setRenderOptions, which re-highlights the
// subscribed instances itself.
export function diffWorkerPool(
	options: PoolRenderOptions,
	preloadPaths: string[] = [],
): WorkerPoolManager {
	const pool = getOrCreateWorkerPoolSingleton({
		poolOptions: {
			workerFactory: () =>
				new Worker(
					new URL('@pierre/diffs/worker/worker.js', import.meta.url),
					{ type: 'module' },
				),
			poolSize: POOL_SIZE,
		},
		highlighterOptions: {
			...options,
			langs: preloadLanguages(preloadPaths),
			preferredHighlighter: 'shiki-wasm',
		},
	})
	const serialized = JSON.stringify(options)
	if (pushedOptions !== null && pushedOptions !== serialized)
		void pushRenderOptions(pool, options)
	pushedOptions = serialized
	return pool
}

async function pushRenderOptions(
	pool: WorkerPoolManager,
	options: PoolRenderOptions,
): Promise<void> {
	try {
		await pool.setRenderOptions(options)
	} catch {
		// A theme no loader can resolve keeps the pool on its previous theme (the settings decoder
		// only admits loadable ones, so this is a failed chunk load).
	}
}
