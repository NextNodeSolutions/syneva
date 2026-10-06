import { persist } from '@app/store'
import { requireState, S, toast } from '@app/store'
import { askAgent } from '@entities/review/api'
import {
	currentFileComments,
	currentFileOrNull,
	hasCurrentFile,
	fromDisplayLine,
} from '@entities/review/changes'
import { cur } from '@entities/review/file/contents'
import { toggleFileComposer } from '@features/manage-comment/composer'
import { closeComposerIfEmpty } from '@features/manage-comment/selection'
import { render } from '@shared/lib/render-scheduler'
import { uuid } from '@shared/lib/uuid'
import { fileCommentsEnabled } from '@widgets/diff-view/comment-thread/file-comments'
import { D } from '@widgets/diff-view/runtime'

// A new comment carries an intent: "question" (Ask - pushed to the agent now via /ask, answered live) or "action" (Request change - goes back on Send); editing just updates the body; the whole-file composer binds here too.
export function installCommentBindings(): void {
	S.saveComment = () => submitComment('action') // editing Save + the `c` shortcut default
	S.ask = () => submitComment('question')
	S.requestChange = () => submitComment('action')
	S.toggleFileComposer = toggleFileComposer
	// Shown when there's a file to comment on and the whole-file scope adds something over the line threads (hidden on the Overview and single-file desks).
	S.fileCommentAvailable = (): boolean =>
		hasCurrentFile(S.state?.files, S.preview, S.fileIndex) &&
		fileCommentsEnabled()
	S.openFileCommentCount = () =>
		currentFileComments(
			S.state,
			currentFileOrNull(S.state?.files, S.preview, S.fileIndex),
		).filter(c => c.status === 'open' && c.role !== 'agent').length
	installComposerDismissal()
}

// The listener sits on the document, capturing, so it sees the press before any diff control handles the click; composers live inside the diff DOM so containers match directly.
// Every whole-file trigger (file header, oversized card, markdown strip, guide bar) is carved out of the dismissal by its shared data-file-comment-trigger attribute.
function installComposerDismissal(): void {
	document.addEventListener(
		'pointerdown',
		event => {
			if (!S.composerOpen && !S.fileComposerOpen) return
			const { target } = event
			if (
				target instanceof Element &&
				target.closest('[data-composer], [data-file-comment-trigger]')
			)
				return
			// Fires on pointerdown, before the click reaches a diff control: rendering now would rebuild the diff and destroy that control, so the browser drops the pending click and the press is swallowed.
			closeComposerIfEmpty(true)
		},
		true,
	)
}

type CommentIntent = 'question' | 'action'

function submitComment(intent: CommentIntent): void {
	const body = (S.composerBody || '').trim()
	if (!body) return
	if (S.editingCommentId) {
		updateEditedComment(body)
		return
	}
	const anchor = S.fileComposerOpen ? fileAnchor() : selectedAnchor()
	if (!anchor) return
	const now = new Date().toISOString()
	const comment = {
		id: uuid(),
		path: anchor.path,
		side: anchor.side,
		lineNumber: anchor.lineNumber,
		endLine: anchor.endLine,
		anchorText: anchor.anchorText,
		createdAt: now,
		updatedAt: now,
		status: 'open' as const,
		role: 'user' as const,
		body,
		intent,
		anchor: anchor.anchor,
	}
	requireState().comments.push(comment)
	S.composerOpen = false
	S.fileComposerOpen = false
	void render()
	persist()
	if (intent === 'question') {
		void askAgent({
			path: comment.path,
			lineNumber: comment.lineNumber,
			side: comment.side,
			body,
		})
		toast('Asked - waiting for answer')
		return
	}
	toast('Comment saved')
}

function updateEditedComment(body: string): void {
	const comment = requireState().comments.find(
		c => c.id === S.editingCommentId,
	)
	if (comment) {
		comment.body = body
		comment.updatedAt = new Date().toISOString()
	}
	S.editingCommentId = null
	S.composerOpen = false
	S.fileComposerOpen = false
	void render()
	persist()
	toast('Comment updated')
}

// Converts through the line map because S.selected is display space (replayed decisions renumber the rendered diff); the anchor text comes from the current file's fetched contents, best-effort (the server re-derives its own anchorText on reload).
// A `cur` for another file stays undefined.
type CommentAnchor = {
	path: string
	side: 'additions' | 'deletions'
	lineNumber: number
	endLine?: number | undefined
	anchorText?: string | undefined
	anchor?: 'file' | undefined
}

// lineNumber 0 is the reserved file-level slot (mirrors the backend's FILE_LEVEL_LINE).
function fileAnchor(): CommentAnchor | null {
	const file = currentFileOrNull(S.state?.files, S.preview, S.fileIndex)
	if (!file) return null
	return { path: file.path, side: 'additions', lineNumber: 0, anchor: 'file' }
}

function selectedAnchor(): CommentAnchor | null {
	const file = currentFileOrNull(S.state?.files, S.preview, S.fileIndex)
	if (!file) return null
	const { side, lineNumber, endLine } = S.selected
	const anchor: CommentAnchor = {
		path: file.path,
		side,
		lineNumber: fromDisplayLine(side, lineNumber, D.lineMap),
	}
	if (typeof endLine === 'number')
		anchor.endLine = fromDisplayLine(side, endLine, D.lineMap)
	if (cur.path === file.path) {
		const contents =
			side === 'deletions' ? cur.oldContents : cur.newContents
		anchor.anchorText = contents.split('\n')[anchor.lineNumber - 1]
	}
	return anchor
}
