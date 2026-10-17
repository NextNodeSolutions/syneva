import { guideInputs, hasGuide } from '@entities/review/guide/guide'
import {
	closeComposer,
	closeFileComposer,
} from '@features/manage-comment/composer'
import { cursorReset, cursorSelection } from '@widgets/diff-view/cursor'
import { golineActive, golineCancel } from '@widgets/diff-view/cursor-goline'

import { S } from './store'

// The Esc cascade: one press closes the topmost overlay; with every transient surface gone, a press climbs the reading one level.

function closeTopOverlay(): boolean {
	if (S.confirmMsg) {
		S.confirmMsg = ''
		return true
	}
	if (S.sendOpen) {
		S.sendOpen = false
		S.sendNote = ''
		return true
	}
	if (S.settingsOpen) {
		S.settingsOpen = false
		return true
	}
	// The Reset dropdown is the shallowest overlay - nothing behind it closes.
	if (S.resetMenuOpen) {
		S.setResetMenu?.(false)
		return true
	}
	return false
}

function closeTransient(): boolean {
	// Esc clears the query first, so closing the panel (which would discard the search with it) stays a deliberate second press.
	if (S.notesOpen && S.notesQuery) {
		S.setNotesQuery?.('')
		return true
	}
	if (S.notesOpen) {
		S.notesOpen = false
		return true
	}
	if (S.fileComposerOpen) {
		closeFileComposer()
		return true
	}
	if (S.composerOpen || S.editingCommentId) {
		cursorReset()
		closeComposer()
		return true
	}
	if (cursorSelection()) {
		cursorReset()
		return true
	}
	// Closes only once every transient surface above it is gone, so Esc dismisses a composer/modal opened over the drawer first.
	if (S.treeDrawerOpen) {
		S.treeDrawerOpen = false
		return true
	}
	return false
}

// The code closes onto its domain's reading, the domain onto the project level.
function climbReading(): void {
	if (!hasGuide(guideInputs(S)) || S.overviewOpen) return
	if (S.codeOpen && S.domainId) S.closeCode?.()
	else S.openOverview?.()
}

export function escape(): void {
	if (golineActive()) {
		golineCancel()
		return
	}
	if (closeTopOverlay() || closeTransient()) return
	climbReading()
}
