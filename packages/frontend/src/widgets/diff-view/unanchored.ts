import {
	currentComments,
	currentFileOrNull,
	groupLineComments,
	isFileComment,
	isUnanchored,
} from '@entities/review/changes'

import { diffCtx } from './context'

import type { ThreadMeta } from '@entities/review/annotations'

export function unanchoredThreads(): ThreadMeta[] {
	const file = currentFileOrNull(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
	if (!file) return []
	const groups = groupLineComments(
		currentComments(diffCtx().S.state, file).filter(c => !isFileComment(c)),
	)
	const out: ThreadMeta[] = []
	for (const comments of groups.values()) {
		if (!comments.some(c => c.status === 'open')) continue
		if (!comments.some(c => isUnanchored(c, file))) continue
		const [first] = comments
		if (!first) continue
		out.push({
			type: 'thread',
			path: first.path,
			side: first.side,
			lineNumber: first.lineNumber,
			status: 'open',
			comments,
		})
	}
	return out
}
