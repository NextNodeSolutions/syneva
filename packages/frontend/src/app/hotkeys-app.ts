import {
	cmdShift,
	enter,
	inComposer,
	inNotes,
	inOverview,
	key,
	navigable,
	shift,
} from '@app/hotkey-matchers'
import { guideInputs, hasGuide } from '@entities/review/guide/guide'
import {
	closeComposer,
	closeFileComposer,
} from '@features/manage-comment/composer'
import { askConfirm } from '@widgets/dialogs/confirm'
import { cursorReset, cursorSelection } from '@widgets/diff-view/cursor'
import { golineActive, golineCancel } from '@widgets/diff-view/cursor-goline'

import { S } from './store'

import type { Hotkey } from '@app/hotkey-matchers'

// The Esc cascade closes the topmost overlay one press each.
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

function escape(): void {
	if (golineActive()) {
		golineCancel()
		return
	}
	if (closeTopOverlay()) return
	// Esc clears the query first, so closing the panel (which would discard the search with it) stays a deliberate second press.
	if (S.notesOpen && S.notesQuery) {
		S.setNotesQuery?.('')
		return
	}
	if (S.notesOpen) {
		S.notesOpen = false
		return
	}
	if (S.fileComposerOpen) {
		closeFileComposer()
		return
	}
	if (S.composerOpen || S.editingCommentId) {
		cursorReset()
		closeComposer()
		return
	}
	if (cursorSelection()) {
		cursorReset()
		return
	}
	// Closes only once every transient surface above it is gone, so Esc dismisses a composer/modal opened over the drawer first.
	if (S.treeDrawerOpen) S.treeDrawerOpen = false
}

export const HOTKEYS_NOTES: Hotkey[] = [
	{
		combo: '↑',
		desc: 'Previous note (panel)',
		group: 'Navigate',
		test: key('ArrowUp'),
		when: inNotes,
		run: () => S.notesCursorMove?.(-1),
	},
	{
		combo: '↓',
		desc: 'Next note (panel)',
		group: 'Navigate',
		test: key('ArrowDown'),
		when: inNotes,
		run: () => S.notesCursorMove?.(1),
	},
	{
		combo: '↵',
		desc: 'Jump to note (panel)',
		group: 'Navigate',
		test: enter,
		when: inNotes,
		run: () => S.notesJumpCursor?.(),
	},
	{
		combo: '/',
		desc: 'Filter notes (panel)',
		group: 'View',
		test: key('/'),
		when: inNotes,
		run: () => S.notesFocusSearch?.(),
	},
]

export const HOTKEYS_APP: Hotkey[] = [
	{
		combo: '⇧→',
		desc: 'Next file (active view order)',
		group: 'Navigate',
		test: shift('ArrowRight'),
		when: navigable,
		run: () => S.nextFile?.(),
	},
	{
		combo: '⇧←',
		desc: 'Previous file (active view order)',
		group: 'Navigate',
		test: shift('ArrowLeft'),
		when: navigable,
		run: () => S.prevFile?.(),
	},
	{
		combo: '⌘⇧↓',
		desc: 'Next file (tree order)',
		group: 'Navigate',
		test: cmdShift('ArrowDown'),
		when: navigable,
		run: () => S.treeStep?.(1),
	},
	{
		combo: '⌘⇧↑',
		desc: 'Previous file (tree order)',
		group: 'Navigate',
		test: cmdShift('ArrowUp'),
		when: navigable,
		run: () => S.treeStep?.(-1),
	},
	{
		combo: 'o',
		desc: 'Overview',
		group: 'Navigate',
		test: key('o'),
		when: () => hasGuide(guideInputs(S)) && navigable(),
		run: () => S.openOverview?.(),
	},
	{
		combo: '↵',
		desc: 'Start review',
		group: 'Navigate',
		test: enter,
		when: inOverview,
		run: () => S.startGuided?.(),
	},
	{
		combo: '⇧H',
		desc: 'Hide approved changes (multi-round)',
		group: 'View',
		when: navigable,
		test: shift('H'),
		run: () => S.toggleHideReviewed?.(),
	},
	{
		combo: 'w',
		desc: 'Tree / Walkthrough sidebar',
		group: 'View',
		when: () => hasGuide(guideInputs(S)) && navigable(),
		test: key('w'),
		run: () =>
			(S.sidebarTab = S.sidebarTab === 'tree' ? 'walkthrough' : 'tree'),
	},
	{
		combo: 'n',
		desc: 'Review notes (comments & questions)',
		group: 'View',
		// Reachable from the Overview and file mode too (the notes span the whole review); only a live composer keeps it, since 'n' would be text there.
		when: () => !inComposer(),
		test: key('n'),
		run: () => S.toggleNotes?.(),
	},
	{
		combo: '⇧B',
		desc: 'Files drawer (narrow screens)',
		group: 'View',
		when: navigable,
		test: shift('B'),
		run: () => (S.treeDrawerOpen = !S.treeDrawerOpen),
	},
	{
		combo: '⇧R',
		desc: 'Reset review (keeps the notes)',
		group: 'App',
		test: shift('R'),
		when: navigable,
		run: () =>
			askConfirm(
				'Reset the review? Every decision and sign-off clears; the notes stay.',
				() => void S.reset?.('review'),
			),
	},
	{
		combo: '⇧S',
		desc: 'Send to agent',
		group: 'App',
		test: shift('S'),
		when: navigable,
		run: () => S.confirmSend?.(),
	},
	{
		combo: '⇧Q',
		desc: 'Close Syneva (stops the desk)',
		group: 'App',
		test: shift('Q'),
		when: navigable,
		run: () => S.confirmClose?.(),
	},
	{
		combo: '⇧,',
		desc: 'Settings',
		group: 'App',
		test: e =>
			(e.key === '<' || (e.key === ',' && e.shiftKey)) &&
			!e.metaKey &&
			!e.ctrlKey &&
			!e.altKey,
		when: () => !inComposer(),
		run: () => S.openSettings?.(),
	},
	{
		combo: '?',
		desc: 'Keyboard map',
		group: 'View',
		// '?' already carries Shift on most layouts, so the bare-key matcher's !e.shiftKey guard cannot apply here; only modifier chords stay excluded.
		test: e => e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey,
		when: () => !inComposer(),
		run: () => {
			S.settingsTab = 'shortcuts'
			S.openSettings?.()
		},
	},
	{
		combo: 'Esc',
		desc: 'Close / cancel',
		group: 'App',
		test: e => e.key === 'Escape',
		typing: true,
		run: escape,
		goline: true,
	},
]
