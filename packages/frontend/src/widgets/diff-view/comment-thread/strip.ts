import { cx } from '@shared/lib/cx'
import { caption } from '@syneva/design-system/controls.styles'

import { unanchoredThreads } from '../unanchored'

import { buildCommentThread } from './comment-thread'
import { annotation } from './comment-thread.styles'
import { strip as s } from './strip.styles'

export function unanchoredStrip(): HTMLElement | null {
	const orphans = unanchoredThreads()
	if (!orphans.length) return null
	const strip = document.createElement('div')
	strip.className = cx(s.strip)
	strip.dataset.unanchored = ''
	const head = document.createElement('div')
	head.className = cx(caption.base, caption.upper, s.head)
	const noun = orphans.length === 1 ? 'thread' : 'threads'
	const pronoun = orphans.length === 1 ? 'its' : 'their'
	head.textContent = `${orphans.length} comment ${noun} lost ${pronoun} place in this diff - resolve or reply here`
	strip.appendChild(head)
	for (const [index, thread] of orphans.entries()) {
		const box = document.createElement('div')
		box.className = cx(annotation.slot, index > 0 && s.rule)
		box.dataset.thread = `${thread.side}:${thread.lineNumber}` // blockers jump target
		box.appendChild(buildCommentThread(thread))
		strip.appendChild(box)
	}
	return strip
}
