import { cx } from '@shared/lib/cx'
import { esc } from '@shared/lib/esc'
import { dot } from '@syneva/design-system/controls.styles'

import { awaiting } from './awaiting.styles'
import { diffCtx } from './context'

// The waiting indicator under an unanswered question has three states, derived per poll tick from
// the desk-liveness fields: queued (the question never reached an agent - nothing is awaiting),
// active (delivered, and the agent posted a `syneva status` line), or plain waiting. Desk-global
// by design: one desk, one agent.
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

// The indicator's classes per state: the line's tone, and its dot - live while an agent holds
// the question, still once it is queued.
function lineClass(isQueued: boolean): string {
	return cx(awaiting.line, isQueued && awaiting.queued)
}

function dotClass(isQueued: boolean): string {
	return cx(dot.base, isQueued ? dot.amber : [dot.accent, dot.live])
}

// The state the indicator was drawn in (data-awaiting), so a poll tick re-classes it only when
// the state flips.
function stateOf(isQueued: boolean): string {
	return isQueued ? 'queued' : 'waiting'
}

// The indicator's markup, for the paths that build a thread from an HTML string.
export function awaitingHtml(): string {
	const { isQueued, label, activity } = awaitingParts()
	const activityHtml = activity ? esc(` · ${activity}`) : ''
	return `<div class="${lineClass(isQueued)}" data-awaiting="${stateOf(isQueued)}"><span class="${dotClass(isQueued)}" data-awaiting-part="dot" aria-hidden="true"></span><span data-awaiting-part="label">${esc(label)}</span><span class="${cx(awaiting.activity)}" data-awaiting-part="activity">${activityHtml}</span></div>`
}

// Re-class a mounted indicator whose state flipped: the line's tone and its dot.
function restyle(el: Element, isQueued: boolean): void {
	el.setAttribute('data-awaiting', stateOf(isQueued))
	el.setAttribute('class', lineClass(isQueued))
	el.querySelector('[data-awaiting-part="dot"]')?.setAttribute(
		'class',
		dotClass(isQueued),
	)
}

// Patch every mounted waiting indicator in place. Called from the 1.5s poll: activity/presence
// changes alone must not trigger a full render() (it rebuilds the diff DOM), so the indicator
// spans are updated directly. The hooks are data attributes - the class names are hashed.
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
