import { currentFileOrNull, fromDisplayLine } from '@entities/review/changes'
import { orderedDomains } from '@entities/review/guide/domains'
import {
	changeAt,
	changeSpan,
	domainEntry,
	neighbourChange,
	neighbourDomainId,
	orderedDomainChanges,
} from '@entities/review/guide/navigation'
import { domainById, referenceStatus } from '@entities/review/guide/resolution'
import { pushReturnPoint } from '@entities/review/guide/return-point'
import { $ } from '@shared/lib/dom'
import { render } from '@shared/lib/render-scheduler'
import { cursorSelection, cursorSyncTo } from '@widgets/diff-view/cursor'
import { D } from '@widgets/diff-view/runtime'

import { S, toast } from '../store'

import { foldTreeForCode, isReading, moveLayout } from './layout-motion'
import { openPreview } from './navigate'

import type { GuideReturnPoint } from '@entities/review/guide/return-point'

// The guided review's moves: select a domain (its explanation beside its first change), step domains and a domain's changes, follow a reference to its exact code and come back. Every move lands through jumpToSpan, so the real diff and the virtual navigator do the landing.

// The explanation's scroller: the reading surface when the domain reads full width (it wraps the body, so document order finds it first), the pane's body beside the code.
const PANE_SCROLLER = '[data-reading], [data-guide-pane-body]'

function paneBody(): HTMLElement | null {
	return document.querySelector<HTMLElement>(PANE_SCROLLER)
}

// The diff file on screen, by path; null while a preview is shown.
function shownDiffPath(): string | null {
	if (S.preview) return null
	return S.state?.files[S.fileIndex]?.path ?? null
}

function currentPoint(): GuideReturnPoint {
	return {
		domainId: S.domainId,
		codeOpen: S.codeOpen,
		filePath: shownDiffPath(),
		previewPath: S.preview?.path ?? null,
		previewSide: S.preview?.previewSide,
		cursor: cursorSelection(),
		paneScroll: paneBody()?.scrollTop ?? 0,
		diffScroll: $('diff').scrollTop,
	}
}

function rememberPosition(): void {
	S.guideReturn = pushReturnPoint(S.guideReturn, currentPoint())
}

function openDomainEntry(domainId: string): boolean {
	const { state } = S
	const domain = domainById(state, domainId)
	if (!state || !domain) return false
	const entry = domainEntry(domain, state)
	if (!entry) return false
	if ('span' in entry) {
		S.jumpToSpan?.(entry.span)
		return true
	}
	const index = state.files.findIndex(file => file.path === entry.path)
	if (index < 0) return false
	S.selectFile?.(index)
	return true
}

// A domain opened from the project level reads full width first; one reached beside the code (the next domain, a related one) keeps the code open and lands on its first change. From a reading the move plays as the motion (a cross-fade between two readings); beside the code it is plain.
function selectDomain(domainId: string): void {
	const move = (): void => {
		if (S.overviewOpen) S.codeOpen = false
		S.domainId = domainId
		S.overviewOpen = false
		S.guideReturn = []
		if (S.codeOpen) openDomainEntry(domainId)
	}
	if (isReading()) void moveLayout(move)
	else move()
	requestAnimationFrame(() => paneBody()?.scrollTo({ top: 0 }))
}

// Enter on the domain's reading: its code opens beside it, on its first change, as the one motion; a domain that owns no change opens the file on hand.
function openCode(): void {
	const domainId = S.domainId ?? orderedDomains(S.state?.guide)[0]?.id
	if (!domainId) return
	void moveLayout(() => {
		foldTreeForCode()
		S.domainId = domainId
		S.codeOpen = true
		openDomainEntry(domainId)
	})
}

// Esc on the code: it closes back onto the domain's reading, the motion played backwards; without a domain, onto the project level.
function closeCode(): void {
	if (!S.domainId) {
		S.openOverview?.()
		return
	}
	void moveLayout(() => {
		S.codeOpen = false
	})
}

function stepDomain(direction: 1 | -1): void {
	const next = neighbourDomainId(S.state, S.domainId, direction)
	if (!next) return
	selectDomain(next)
	const domains = orderedDomains(S.state?.guide)
	const position = domains.findIndex(domain => domain.id === next)
	toast(`Domain ${position + 1} of ${domains.length}`)
}

// The owned change the cursor sits in, when the shown file is one of the domain's. The cursor holds displayed lines, the changes raw ones: a decided block above shifts the two apart.
function currentOwnedChange(domainId: string): ReturnType<typeof changeAt> {
	const { state } = S
	const domain = domainById(state, domainId)
	const shown = currentFileOrNull(state?.files, S.preview, S.fileIndex)
	const cursor = cursorSelection()
	if (!state || !domain || !shown || !cursor) return undefined
	return changeAt(orderedDomainChanges(domain, state), {
		path: shown.path,
		side: cursor.side,
		lineNumber: fromDisplayLine(cursor.side, cursor.lineNumber, D.lineMap),
	})
}

function stepDomainChange(direction: 1 | -1): void {
	const { state } = S
	const domainId = S.domainId ?? orderedDomains(state?.guide)[0]?.id ?? null
	const domain = domainId ? domainById(state, domainId) : undefined
	if (!state || !domain) return
	if (S.domainId !== domainId) S.domainId = domainId
	const ordered = orderedDomainChanges(domain, state)
	const next = neighbourChange(
		ordered,
		currentOwnedChange(domain.id),
		direction,
	)
	if (!next) {
		toast('This domain owns no changed block')
		return
	}
	S.jumpToSpan?.(changeSpan(next))
}

// Pointer and keyboard both land here: an unresolved target is named, never guessed at.
function followReference(domainId: string, refId: string): void {
	const domain = domainById(S.state, domainId)
	const reference = domain?.references?.find(ref => ref.id === refId)
	if (!reference) return
	const status = referenceStatus(S.state, domainId, refId)
	if (status.status === 'unresolved') {
		toast(
			`Unresolved: ${reference.path} line ${reference.lineNumber} - ${status.reason ?? 'the target is gone'}`,
		)
		return
	}
	rememberPosition()
	S.domainId = domainId
	S.jumpToSpan?.(reference)
}

// A point on the domain's reading: the code closes onto it (the motion backwards when it was open) and the reading scrolls to where it was.
async function restoreReading(point: GuideReturnPoint): Promise<void> {
	const move = (): void => {
		S.domainId = point.domainId
		S.codeOpen = false
	}
	if (S.codeOpen) await moveLayout(move)
	else {
		move()
		await render()
	}
	requestAnimationFrame(() => paneBody()?.scrollTo({ top: point.paneScroll }))
}

// The file (or preview) is shown and rendered first: opening one resets the cursor and the diff's scroll, so the saved position only lands once that render is done - at once after it, before any later pass could move it.
async function restore(point: GuideReturnPoint): Promise<void> {
	if (!point.codeOpen) {
		await restoreReading(point)
		return
	}
	if (point.previewPath) {
		S.domainId = point.domainId
		if (
			S.preview?.path !== point.previewPath ||
			S.preview.previewSide !== point.previewSide
		)
			await openPreview(point.previewPath, point.previewSide)
		else await render()
	} else {
		const index =
			S.state?.files.findIndex(file => file.path === point.filePath) ?? -1
		if (index < 0) {
			toast('That file is no longer in the review')
			return
		}
		const move = (): void => {
			S.domainId = point.domainId
			S.codeOpen = true
			if (S.fileIndex !== index || S.preview) S.selectFile?.(index)
			if (point.cursor)
				cursorSyncTo(point.cursor.side, point.cursor.lineNumber)
		}
		if (isReading()) await moveLayout(move)
		else {
			move()
			await render()
		}
	}
	if (point.cursor) cursorSyncTo(point.cursor.side, point.cursor.lineNumber)
	paneBody()?.scrollTo({ top: point.paneScroll })
	$('diff').scrollTo({ top: point.diffScroll })
}

function guideBack(): void {
	const point = S.guideReturn.at(-1)
	if (!point) {
		toast('Nowhere to go back to')
		return
	}
	S.guideReturn = S.guideReturn.slice(0, -1)
	void restore(point)
}

export function installGuideDomainBindings(): void {
	S.selectDomain = selectDomain
	S.openCode = openCode
	S.closeCode = closeCode
	S.stepDomain = stepDomain
	S.stepDomainChange = stepDomainChange
	S.followReference = followReference
	S.guideBack = guideBack
	S.toggleGuidePane = () => {
		S.guidePaneOpen = !S.guidePaneOpen
	}
	S.toggleBlockDetail = key => {
		const next = new Set(S.guideExpanded)
		if (next.has(key)) next.delete(key)
		else next.add(key)
		S.guideExpanded = next
	}
}
