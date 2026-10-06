import { getFiletypeFromFileName } from '@pierre/diffs'
import { getOrCreateWorkerPoolSingleton } from '@pierre/diffs/worker'

import type { Settings } from '@entities/settings/model'
import type { LineDiffTypes } from '@pierre/diffs'
import type { WorkerPoolManager } from '@pierre/diffs/worker'

// Tokenizing runs off the main thread: an un-highlighted diff paints plain rows at once and colors land when a worker finishes; highlighted results are cached by cacheKey across instances.
// Two workers: the desk shows one file at a time, so a second only overlaps a prefetch - every extra worker is one more boot competing with the cold open.
const POOL_SIZE = 2

// In pool mode Pierre highlights with these, not the instance's own theme/lineDiffType options; the oniguruma engine tokenizes ~35% faster than the JS regex engine on TypeScript, and its wasm only loads inside the workers.
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

let pushedOptions: string | null = null

// Only the files the desk opens - every extra grammar delays the boot, and with it the first plain paint.
function preloadLanguages(paths: string[]): string[] {
	return [...new Set(paths.map(path => getFiletypeFromFileName(path)))]
}

// The first call boots the workers as soon as the review is known (main.tsx), so the boot overlaps the first contents fetch; later calls return the singleton.
// A changed theme or line-diff mode syncs through setRenderOptions, which re-highlights the subscribed instances itself.
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
		/* a failed option push keeps the pool on its previous theme/mode; the settings decoder only admits loadable values */
	}
}
