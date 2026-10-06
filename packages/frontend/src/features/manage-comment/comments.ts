import { toDisplayLine } from '@entities/review/changes'
import { featureCtx } from '@features/context'
import { render } from '@shared/lib/render-scheduler'

export function editComment(id: string): void {
	const comment = featureCtx()
		.requireState()
		.comments.find(c => c.id === id)
	if (!comment || comment.role === 'agent') return
	featureCtx().S.composerBody = comment.body
	featureCtx().S.editingCommentId = id
	if (comment.anchor === 'file') {
		featureCtx().S.composerOpen = false
		featureCtx().S.fileComposerOpen = true
	} else {
		featureCtx().S.fileComposerOpen = false
		featureCtx().S.composerOpen = true
		// Comments persist raw lines; S.selected is display space.
		featureCtx().S.selected = {
			side: comment.side,
			lineNumber: toDisplayLine(
				comment.side,
				comment.lineNumber,
				featureCtx().lineMap(),
			),
		}
	}
	void render()
}

export function deleteComment(id: string): void {
	const state = featureCtx().requireState()
	const comment = state.comments.find(c => c.id === id)
	if (!comment || comment.role === 'agent') return
	if (featureCtx().S.editingCommentId === id) {
		featureCtx().S.editingCommentId = null
		featureCtx().S.composerOpen = false
		featureCtx().S.fileComposerOpen = false
	}
	state.comments = state.comments.filter(c => c.id !== id)
	void render()
	// The saver is burst-debounced and the next /state poll reconciles against the desk, which still holds the comment until the save lands, so a re-add is bounded by that merge.
	featureCtx().persist()
	featureCtx().toast('Comment deleted')
}
