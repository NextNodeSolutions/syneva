import { currentFileOrNull, fileFinished } from '@entities/review/changes'
import { notesPanelView, sameThread } from '@entities/review/notes'
import {
	jumpTargetFor,
	jumpToThread,
	setPendingJump,
} from '@widgets/diff-view/comment-jump'

import { requireState, S } from '../store'

import type { NotesView, ReviewNote } from '@entities/review/notes'

const notesView = (): NotesView => ({ query: S.notesQuery, lens: S.notesLens })

// Other-file notes select the file (or open it as a preview, for notes on unchanged files) and stash a pending jump the render funnel consumes once the target is actually on screen.
function advanceFrom(pos: number): boolean {
	const { flat } = notesPanelView(S.state, notesView())
	if (!flat.length) return false
	const start = pos >= 0 && pos < flat.length ? pos : 0
	const ordered = [...flat.slice(start), ...flat.slice(0, start)]
	const target = ordered.find(n => n.status !== 'resolved')
	if (!target) return false
	S.notesCursor = flat.indexOf(target)
	jumpToNote(target)
	return true
}

function installResolveAdvance(): void {
	// A resolve reports its thread BEFORE the status flips, so the panel position is the pre-resolve one and the queued advance's scan sees the flip.
	S.noteResolved = ref => {
		if (!S.notesOpen) return
		const { flat } = notesPanelView(S.state, notesView())
		const pos = flat.findIndex(n => sameThread(n, ref))
		const path = currentFileOrNull(
			S.state?.files,
			S.preview,
			S.fileIndex,
		)?.path
		if (path && fileFinished(S.state, path)) {
			queueMicrotask(() => void advanceFrom(pos))
			return
		}
		S.notesAdvanceAfter = { ref, pos }
	}
	// The armed flow fires only when THIS path signs off; any other sign-off clears it - the reviewer moved on, the flow must not fire from nowhere.
	S.notesAfterSignOff = path => {
		const armed = S.notesAdvanceAfter
		S.notesAdvanceAfter = null
		if (!armed || armed.ref.path !== path) return false
		return advanceFrom(armed.pos)
	}
}

export function installNotesBindings(): void {
	S.toggleNotes = () => {
		S.notesOpen = !S.notesOpen
	}
	S.jumpToNote = jumpToNote
	// The visible rows come from notesPanelView - the same derivation the component renders - so the cursor and the screen can never drift apart.
	S.setNotesQuery = query => {
		S.notesQuery = query
		S.notesCursor = 0
	}
	S.setNotesLens = lens => {
		S.notesLens = lens
		S.notesCursor = 0
	}
	S.notesCursorMove = dir => {
		S.notesCursor = Math.max(0, S.notesCursor + dir)
		const last = notesPanelView(S.state, notesView()).flat.length - 1
		S.notesCursor = Math.min(S.notesCursor, Math.max(last, 0))
	}
	S.notesJumpCursor = () => {
		const note = notesPanelView(S.state, notesView()).flat[S.notesCursor]
		if (note) jumpToNote(note)
	}
	S.notesFocusSearch = () => {
		S.notesSearchTick++
	}
	installResolveAdvance()
}

function jumpToNote(note: ReviewNote): void {
	const state = requireState()
	const target = jumpTargetFor(note)
	const current = currentFileOrNull(state.files, S.preview, S.fileIndex)
	if (current?.path === note.path) {
		jumpToThread(current, target)
		return
	}
	// The file may have left the review (its comments survive the round): the only way back is the read-only preview, where comments anchor like on any file.
	const index = state.files.findIndex(f => f.path === note.path)
	setPendingJump(target)
	if (index >= 0) S.selectFile?.(index)
	else S.previewFile?.(note.path)
}
