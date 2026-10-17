import {
	cmdShift,
	enter,
	inComposer,
	inDomainPage,
	inNotes,
	inOverview,
	key,
	navigable,
	shift,
} from '@app/hotkey-matchers'
import { guideInputs, hasGuide } from '@entities/review/guide/guide'
import { askConfirm } from '@widgets/dialogs/confirm'

import { escape } from './escape'
import { S } from './store'

import type { Hotkey } from '@app/hotkey-matchers'

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
		combo: '↵',
		desc: 'Open the code of the domain',
		group: 'Navigate',
		test: enter,
		when: inDomainPage,
		run: () => S.openCode?.(),
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
