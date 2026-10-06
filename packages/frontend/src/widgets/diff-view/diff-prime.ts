import { diffCtx } from './context'
import { rawFileDiff } from './diff-metadata'
import { diffWorkerPool, poolRenderOptions } from './diff-workers'

import type { ReviewState } from '@entities/review/model'

type ReviewFile = ReviewState['files'][number]

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
		/* a failed prime leaves the open to highlight the file itself */
	}
}
