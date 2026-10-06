import { featureCtx } from '@features/context'
import { $ } from '@shared/lib/dom'

import { closeComposer, closeFileComposer, openComposer } from './composer'
import { sideFromLineType } from './selection-derive'

import type { AnnotationMeta } from '@entities/review/annotations'
import type { FileDiffOptions } from '@pierre/diffs'
import type { Side } from '@shared/diff-renderer/types'

// Pierre's line callbacks name slightly different payloads per entry point (lineNumber, annotationSide, start/end, older releases' number/line.number/lineInfo.number): the reader takes every candidate as `unknown` and narrows at runtime.
// A library bump renaming a field degrades to the next candidate instead of silently dropping the click.
type LineCallbackPayload = {
	lineNumber?: unknown
	number?: unknown
	line?: { number?: unknown; side?: unknown }
	lineInfo?: { number?: unknown; side?: unknown }
	annotationSide?: unknown
	side?: unknown
	type?: unknown
	start?: unknown
	end?: unknown
}

type DiffCallbacks = FileDiffOptions<AnnotationMeta, undefined>
type LineClickPayload = Parameters<
	NonNullable<DiffCallbacks['onLineNumberClick']>
>[0]
type SelectionRange = Parameters<
	NonNullable<DiffCallbacks['onLineSelected']>
>[0]

type LineTarget = { lineNumber: number; side: Side; endLine?: number }

const PANE_MIDPOINT_FRACTION = 0.5
const CLICK_SUPPRESSION_MS = 350
const LINE_NUMBER_TEXT = /^\d+$/

let dragSelectionStart: LineTarget | null = null
let suppressSelectionUntil = 0
let isIgnoringNextLineClick = false

function readLineNumber(payload: LineCallbackPayload): number | null {
	const candidates = [
		payload.lineNumber,
		payload.number,
		payload.line?.number,
		payload.lineInfo?.number,
	]
	for (const candidate of candidates) {
		if (typeof candidate === 'number' && Number.isFinite(candidate)) {
			return candidate
		}
	}
	return null
}

function readSide(payload: LineCallbackPayload): Side {
	const named =
		payload.annotationSide ??
		payload.side ??
		payload.line?.side ??
		payload.lineInfo?.side ??
		payload.type
	return normalizeSide(named)
}

function extractLinePayload(
	payload: LineCallbackPayload | number | null | undefined,
): LineTarget | null {
	if (typeof payload !== 'object' || payload === null) return null
	const lineNumber = readLineNumber(payload)
	if (lineNumber === null) return null
	return { lineNumber, side: readSide(payload) }
}

function selectionEndpoint(
	range: SelectionRange | null,
): LineCallbackPayload | number | null {
	if (!range) return null
	return range.end || range.start || range
}

function readPointerText(target: Element): string {
	const innerText = target instanceof HTMLElement ? target.innerText : ''
	return (innerText || target.textContent || '').trim()
}

function linePayloadFromPointerEvent(event: PointerEvent): LineTarget | null {
	for (const target of event.composedPath()) {
		if (!(target instanceof Element)) continue
		const text = readPointerText(target)
		if (!LINE_NUMBER_TEXT.test(text)) continue
		const lineType =
			target
				.closest('[data-line-type]')
				?.getAttribute('data-line-type') ?? null
		const box = $('diff').getBoundingClientRect()
		return {
			lineNumber: Number(text),
			side:
				sideFromLineType(lineType) ??
				(event.clientX < box.left + box.width * PANE_MIDPOINT_FRACTION
					? 'deletions'
					: 'additions'),
		}
	}
	return null
}

export function openCommentComposer(): void {
	openComposer()
}

export function normalizeSide(side: unknown): Side {
	return side === 'deletions' || side === 'old' ? 'deletions' : 'additions'
}

function showForDiffLine(payload: LineTarget): void {
	featureCtx().S.selected = {
		side: payload.side,
		lineNumber: payload.lineNumber,
		endLine: payload.endLine,
	}
	// The pointer selection becomes the keyboard cursor too (one highlight, one position), so the arrows continue from the clicked line - a drag's range end.
	featureCtx().cursorSyncTo(
		payload.side,
		payload.endLine ?? payload.lineNumber,
	)
	openCommentComposer()
}

export function composerHasText(): boolean {
	return (
		(featureCtx().S.composerOpen || featureCtx().S.fileComposerOpen) &&
		featureCtx().S.composerBody.trim().length > 0
	)
}

export function closeComposerIfEmpty(isRenderDeferred = false): void {
	if (
		(!featureCtx().S.composerOpen && !featureCtx().S.fileComposerOpen) ||
		composerHasText()
	)
		return
	if (featureCtx().S.fileComposerOpen) closeFileComposer(isRenderDeferred)
	else closeComposer(isRenderDeferred)
}

export function handleDiffSelection(range: SelectionRange | null): void {
	if (Date.now() < suppressSelectionUntil) return
	const payload = range ? extractLinePayload(selectionEndpoint(range)) : null
	if (payload) {
		showForDiffLine(payload)
		return
	}
	if (range) return
	closeComposerIfEmpty()
	isIgnoringNextLineClick = true
	setTimeout(() => (isIgnoringNextLineClick = false), 0)
}

export function handleLineNumberClick(props: LineClickPayload): void {
	if (isIgnoringNextLineClick) {
		isIgnoringNextLineClick = false
		return
	}
	const payload = extractLinePayload(props)
	if (!payload) return
	if (
		featureCtx().S.composerOpen &&
		featureCtx().S.selected.lineNumber === payload.lineNumber &&
		featureCtx().S.selected.side === payload.side
	) {
		if (!composerHasText()) closeComposer()
		suppressSelectionUntil = Date.now() + CLICK_SUPPRESSION_MS
		return
	}
	showForDiffLine(payload)
}

function handleSelectionPointerDown(event: PointerEvent): void {
	dragSelectionStart = linePayloadFromPointerEvent(event)
}

function handleSelectionPointerUp(event: PointerEvent): void {
	const end = linePayloadFromPointerEvent(event)
	if (!dragSelectionStart || !end) return
	const isSameLine =
		dragSelectionStart.lineNumber === end.lineNumber &&
		dragSelectionStart.side === end.side
	if (isSameLine) return
	showForDiffLine({ ...dragSelectionStart, endLine: end.lineNumber })
	dragSelectionStart = null
}

export function attachDiffSelectionHandlers(): void {
	const root = $('diff')
	root.removeEventListener('pointerdown', handleSelectionPointerDown)
	root.addEventListener('pointerdown', handleSelectionPointerDown)
	root.removeEventListener('pointerup', handleSelectionPointerUp)
	root.addEventListener('pointerup', handleSelectionPointerUp)
}
