import {
	currentChanges,
	toDisplayLine,
	currentFileOrNull,
} from '@entities/review/changes'

import { diffCtx } from './context'
import { D } from './runtime'

import type { ChangeState } from '@entities/review/model'
import type { AnnotationInput } from './types'

function changeAnnotation(
	ch: ChangeState,
	lineNumber: number,
): AnnotationInput {
	return {
		side: ch.side,
		lineNumber,
		metadata: {
			type: 'change',
			id: ch.id,
			side: ch.side,
			lineNumber: ch.lineNumber,
			title: ch.title,
			path: ch.path,
		},
	}
}

function pushChange(annotations: AnnotationInput[], ch: ChangeState): void {
	annotations.push(
		changeAnnotation(
			ch,
			ch.displayEndLine ??
				toDisplayLine(ch.side, ch.endLine ?? ch.lineNumber, D.lineMap),
		),
	)
}

// The brick view draws one brick's blocks: a block outside it has no rows in the cut, and its anchor (its raw end, with no part on the cut to place it) can fall on the brick's edge row, where its verdict row would sit as a stray.
function isDrawn(ch: ChangeState): boolean {
	return !D.focus || D.focus.brick.changes.some(inside => inside.id === ch.id)
}

export function changeAnnotations(
	coveredChangeIds: Set<string>,
): AnnotationInput[] {
	const annotations: AnnotationInput[] = []
	for (const ch of currentChanges(
		diffCtx().S.state,
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		),
	)) {
		if (ch.status !== 'pending' || coveredChangeIds.has(ch.id)) continue
		if (isDrawn(ch)) pushChange(annotations, ch)
	}
	return annotations
}
