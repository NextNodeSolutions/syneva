import { askAgent } from '@entities/review/api'
import {
	domainTargetOf,
	domainThreadKey,
} from '@entities/review/domain-threads'
import { notifyStateMutation } from '@shared/lib/reactive'
import { uuid } from '@shared/lib/uuid'

import { persist, requireState, S, toast } from '../store'

import type { DomainComment } from '@entities/review/model'

// Feedback on the guide from the explanation pane: a question goes to the agent now (/ask, answered live in the thread), a change request rides the next Send as a domainRequest; both are the reviewer's records, saved with the review like a line comment. Nothing here touches a verdict.

function composerTarget(): DomainComment['target'] | null {
	const composer = S.domainComposer
	if (!composer) return null
	return domainTargetOf(
		requireState().guide,
		composer.domainId,
		composer.blockId,
	)
}

function submitDomainComment(intent: 'question' | 'action'): void {
	const body = S.domainComposerBody.trim()
	const target = composerTarget()
	if (!body || !target) return
	const now = new Date().toISOString()
	const comment: DomainComment = {
		id: uuid(),
		target,
		body,
		createdAt: now,
		updatedAt: now,
		status: 'open',
		intent,
		role: 'user',
	}
	requireState().domainComments.push(comment)
	S.domainComposer = null
	S.domainComposerBody = ''
	notifyStateMutation()
	persist()
	if (intent === 'question') {
		void askAgent({
			domainId: target.domainId,
			blockId: target.blockId,
			body,
		})
		toast('Asked - waiting for answer')
		return
	}
	toast('Change requested - goes to the agent on Send')
}

// Resolving or reopening is the reviewer's bookkeeping on the thread; it approves nothing.
function setDomainThreadStatus(key: string, status: 'open' | 'resolved'): void {
	for (const comment of requireState().domainComments) {
		if (domainThreadKey(comment.target) === key) comment.status = status
	}
	notifyStateMutation()
	persist()
	toast(status === 'resolved' ? 'Resolved' : 'Reopened')
}

export function installDomainFeedbackBindings(): void {
	S.openDomainComposer = (domainId, blockId) => {
		S.domainComposer = { domainId, blockId }
		S.domainComposerBody = ''
	}
	S.closeDomainComposer = () => {
		S.domainComposer = null
		S.domainComposerBody = ''
	}
	S.submitDomainComment = submitDomainComment
	S.setDomainThreadStatus = setDomainThreadStatus
	// From the notes panel: the domain's explanation, pane open, its discussion at the bottom; a domain the guide dropped shows its threads alone (the pane's gone-domain view).
	S.openDomainThread = domainId => {
		S.guidePaneOpen = true
		S.selectDomain?.(domainId)
	}
}
