import { diffCtx } from './context'
import { rawFileDiff } from './diff-metadata'
import { diffWorkerPool, poolRenderOptions } from './diff-workers'

import type { ReviewState } from '@entities/review/model'

type ReviewFile = ReviewState['files'][number]

// Highlight a file in Pierre's worker pool before the reviewer opens it
// (primeDiffHighlightCache), so the open paints colored rows straight from the cache. Only a file
// without decisions primes: its rendered diff is exactly the raw parse, with the same cacheKey,
// while a decided file renders a replay of changes the store derives on open.
export async function primeDiffHighlight(
	file: ReviewFile,
	contents: { oldContents: string; newContents: string },
): Promise<void> {
	const { S } = diffCtx()
	if (S.state?.decisions?.some(decision => decision.path === file.path))
		return
	const pool = diffWorkerPool(poolRenderOptions(S.settings))
	try {
		await pool.primeDiffHighlightCache(rawFileDiff(file, contents))
	} catch {
		// Opportunistic: a failed prime leaves the open to highlight the file itself.
	}
}
