import { cx } from '@shared/lib/cx'
import { esc } from '@shared/lib/esc'
import { dot } from '@syneva/design-system/controls.styles'

import { awaiting } from './awaiting.styles'
import { diffCtx } from './context'

function awaitingParts(): {
	isQueued: boolean
	label: string
	activity: string
} {
	const isQueued = diffCtx().S.queuedQuestions > 0
	return {
		isQueued,
		label: isQueued ? 'No agent attached - question queued' : 'Working',
		activity: isQueued ? '' : (diffCtx().S.agentActivity ?? ''),
	}
}

function lineClass(isQueued: boolean): string {
	return cx(awaiting.line, isQueued && awaiting.queued)
}

function dotClass(isQueued: boolean): string {
	return cx(dot.base, isQueued ? dot.amber : [dot.accent, dot.live])
}

function stateOf(isQueued: boolean): string {
	return isQueued ? 'queued' : 'waiting'
}

export function awaitingHtml(): string {
	const { isQueued, label, activity } = awaitingParts()
	const activityHtml = activity ? esc(` · ${activity}`) : ''
	return `<div class="${lineClass(isQueued)}" data-awaiting="${stateOf(isQueued)}"><span class="${dotClass(isQueued)}" data-awaiting-part="dot" aria-hidden="true"></span><span data-awaiting-part="label">${esc(label)}</span><span class="${cx(awaiting.activity)}" data-awaiting-part="activity">${activityHtml}</span></div>`
}

function restyle(el: Element, isQueued: boolean): void {
	el.setAttribute('data-awaiting', stateOf(isQueued))
	el.setAttribute('class', lineClass(isQueued))
	el.querySelector('[data-awaiting-part="dot"]')?.setAttribute(
		'class',
		dotClass(isQueued),
	)
}

export function updateAwaitingDom(): void {
	const parts = awaitingParts()
	const state = stateOf(parts.isQueued)
	for (const el of document.querySelectorAll<HTMLElement>(
		'[data-awaiting]',
	)) {
		if (el.dataset.awaiting !== state) restyle(el, parts.isQueued)
		const label = el.querySelector('[data-awaiting-part="label"]')
		if (label && label.textContent !== parts.label)
			label.textContent = parts.label
		const activity = el.querySelector('[data-awaiting-part="activity"]')
		const text = parts.activity ? ` · ${parts.activity}` : ''
		if (activity && activity.textContent !== text)
			activity.textContent = text
	}
}
