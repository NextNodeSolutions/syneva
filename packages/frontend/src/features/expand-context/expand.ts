import {
	currentComments,
	currentFileOrNull,
	isFileComment,
	isUnanchored,
	toDisplayLine,
} from '@entities/review/changes'
import { featureCtx } from '@features/context'

import { revealThreads } from './thread-reveals'

import type { FileDiffMetadata } from '@pierre/diffs'
import type { Side } from '@shared/diff-renderer/types'

// In "collapse" mode an annotation on a folded line never renders - and an open change request blocks approval - so after each render a small window auto-expands around any open thread's line (a thread folded away by the agent's edits would be invisible).
// Pierre keys the collapsed region before hunk `i` as `i`; expansion lives on the renderer instance and survives re-renders while the instance is cached.

const REVEAL_CONTEXT = 3

type Loc =
	| { kind: 'visible' }
	| {
			kind: 'collapsed'
			regionIndex: number
			distFromTop: number
			distFromBottom: number
	  }
	| { kind: 'missing' }

type Hunk = FileDiffMetadata['hunks'][number]

function hunkStart(hunk: Hunk, side: Side): number {
	return side === 'additions' ? hunk.additionStart : hunk.deletionStart
}

function hunkCount(hunk: Hunk, side: Side): number {
	return side === 'additions' ? hunk.additionCount : hunk.deletionCount
}

function hunkLoc(
	hunk: Hunk,
	index: number,
	side: Side,
	line: number,
): Loc | null {
	if (hunk.collapsedBefore > 0) {
		const gapStart = hunkStart(hunk, side) - hunk.collapsedBefore
		const gapEnd = hunkStart(hunk, side) - 1
		if (line >= gapStart && line <= gapEnd)
			return {
				kind: 'collapsed',
				regionIndex: index,
				distFromTop: line - gapStart + 1,
				distFromBottom: gapEnd - line + 1,
			}
	}
	const start = hunkStart(hunk, side)
	if (line >= start && line <= start + hunkCount(hunk, side) - 1)
		return { kind: 'visible' }
	return null
}

export function locateDisplayLine(
	fd: FileDiffMetadata,
	side: Side,
	line: number,
): Loc {
	for (let i = 0; i < fd.hunks.length; i++) {
		const hunk = fd.hunks[i]
		if (!hunk) continue
		const loc = hunkLoc(hunk, i, side, line)
		if (loc) return loc
	}
	const last = fd.hunks.at(-1)
	if (!last) return { kind: 'missing' }
	const lastEnd = hunkStart(last, side) + hunkCount(last, side) - 1
	const total =
		side === 'additions' ? fd.additionLines.length : fd.deletionLines.length
	if (line > lastEnd && line <= total)
		return {
			kind: 'collapsed',
			regionIndex: fd.hunks.length,
			distFromTop: line - lastEnd,
			distFromBottom: total - line + 1,
		}
	return { kind: 'missing' }
}

export function revealLine(side: Side, rawLine: number): void {
	if (featureCtx().diffInstance()?.options.expandUnchanged) return
	const fd = featureCtx().fileDiff()
	const inst = featureCtx().diffInstance()
	if (!fd || !inst) return
	const loc = locateDisplayLine(
		fd,
		side,
		toDisplayLine(side, rawLine, featureCtx().lineMap()),
	)
	if (loc.kind !== 'collapsed') return
	const fromTop = loc.distFromTop <= loc.distFromBottom
	inst.expandHunk(
		loc.regionIndex,
		fromTop ? 'up' : 'down',
		(fromTop ? loc.distFromTop : loc.distFromBottom) + REVEAL_CONTEXT,
	)
}

export function revealThreadLines(): void {
	const file = currentFileOrNull(
		featureCtx().S.state?.files,
		featureCtx().S.preview,
		featureCtx().S.fileIndex,
	)
	const instance = featureCtx().diffInstance()
	if (!file || !instance) return
	const threads = currentComments(
		featureCtx().S.state,
		currentFileOrNull(
			featureCtx().S.state?.files,
			featureCtx().S.preview,
			featureCtx().S.fileIndex,
		),
	).filter(
		comment =>
			comment.status === 'open' &&
			!isFileComment(comment) &&
			!isUnanchored(comment, file),
	)
	revealThreads(instance, threads, revealLine)
}
