import { currentFileOrNull } from '@entities/review/changes'
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

import { S, toast } from '../store'

import type { GuideReturnPoint } from '@entities/review/guide/return-point'

// The guided review's moves: select a domain (its explanation beside its first change), step domains and a domain's changes, follow a reference to its exact code and come back. Every move lands through jumpToSpan, so the real diff and the virtual navigator do the landing.

const PANE_BODY = '[data-guide-pane-body]'

function paneBody(): HTMLElement | null {
	return document.querySelector<HTMLElement>(PANE_BODY)
}

function currentPoint(): GuideReturnPoint {
	return {
		domainId: S.domainId,
		fileIndex: S.fileIndex,
		previewPath: S.preview?.path ?? null,
		cursor: cursorSelection(),
		paneScroll: paneBody()?.scrollTop ?? 0,
		diffScroll: $('diff').scrollTop,
	}
}

function rememberPosition(): void {
	S.guideReturn = pushReturnPoint(S.guideReturn, currentPoint())
}

function openDomainEntry(domainId: string): void {
	const { state } = S
	const domain = domainById(state, domainId)
	if (!state || !domain) return
	const entry = domainEntry(domain, state)
	if (!entry) return
	if ('span' in entry) {
		S.jumpToSpan?.(entry.span)
		return
	}
	const index = state.files.findIndex(file => file.path === entry.path)
	if (index >= 0) S.selectFile?.(index)
}

function selectDomain(domainId: string): void {
	S.domainId = domainId
	S.overviewOpen = false
	S.guideReturn = []
	openDomainEntry(domainId)
	requestAnimationFrame(() => paneBody()?.scrollTo({ top: 0 }))
}

function stepDomain(direction: 1 | -1): void {
	const next = neighbourDomainId(S.state, S.domainId, direction)
	if (!next) return
	selectDomain(next)
	const domains = orderedDomains(S.state?.guide)
	const position = domains.findIndex(domain => domain.id === next)
	toast(`Domain ${position + 1} of ${domains.length}`)
}

// The owned change the cursor sits in, when the shown file is one of the domain's.
function currentOwnedChange(domainId: string): ReturnType<typeof changeAt> {
	const { state } = S
	const domain = domainById(state, domainId)
	const shown = currentFileOrNull(state?.files, S.preview, S.fileIndex)
	const cursor = cursorSelection()
	if (!state || !domain || !shown || !cursor) return undefined
	return changeAt(orderedDomainChanges(domain, state), {
		path: shown.path,
		side: cursor.side,
		lineNumber: cursor.lineNumber,
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

function restore(point: GuideReturnPoint): void {
	S.domainId = point.domainId
	if (point.previewPath) S.previewFile?.(point.previewPath)
	else if (S.fileIndex !== point.fileIndex || S.preview)
		S.selectFile?.(point.fileIndex)
	if (point.cursor) cursorSyncTo(point.cursor.side, point.cursor.lineNumber)
	void render()
	requestAnimationFrame(() => {
		paneBody()?.scrollTo({ top: point.paneScroll })
		$('diff').scrollTo({ top: point.diffScroll })
	})
}

function guideBack(): void {
	const point = S.guideReturn.at(-1)
	if (!point) {
		toast('Nowhere to go back to')
		return
	}
	S.guideReturn = S.guideReturn.slice(0, -1)
	restore(point)
}

export function installGuideDomainBindings(): void {
	S.selectDomain = selectDomain
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
