import {
	cmd,
	cmdShift,
	enter,
	inComposer,
	inDiff,
	isMd,
	key,
	shift,
} from '@app/hotkey-matchers'
import { hasCurrentFile } from '@entities/review/changes'
import { approveCurrentFile } from '@features/decide-change/decisions'
import { fileCommentsEnabled } from '@widgets/diff-view/comment-thread/file-comments'
import {
	cursorComment,
	cursorMoveHunk,
	cursorMoveLine,
	cursorResolve,
	cursorVerdict,
} from '@widgets/diff-view/cursor'
import {
	golineActive,
	golineCommit,
	golineDigit,
} from '@widgets/diff-view/cursor-goline'
import {
	isOversizedPlaceholder,
	loadOversizedDiff,
} from '@widgets/diff-view/oversized'

import { S } from './store'

import type { Hotkey } from '@app/hotkey-matchers'

export const HOTKEYS_DIFF: Hotkey[] = [
	{
		combo: '⇧↓',
		desc: 'Next change',
		group: 'Navigate',
		test: shift('ArrowDown'),
		when: inDiff,
		run: () => cursorMoveHunk(1),
	},
	{
		combo: '⇧↑',
		desc: 'Previous change',
		group: 'Navigate',
		test: shift('ArrowUp'),
		when: inDiff,
		run: () => cursorMoveHunk(-1),
	},
	{
		combo: '↑',
		desc: 'Move up a line',
		group: 'Navigate',
		test: key('ArrowUp'),
		when: inDiff,
		run: () => cursorMoveLine(-1),
	},
	{
		combo: '↓',
		desc: 'Move down a line',
		group: 'Navigate',
		test: key('ArrowDown'),
		when: inDiff,
		run: () => cursorMoveLine(1),
	},
	{
		combo: 'j',
		desc: 'Next change',
		group: 'Navigate',
		test: key('j'),
		when: inDiff,
		run: () => cursorMoveHunk(1),
		hide: true,
	},
	{
		combo: 'k',
		desc: 'Previous change',
		group: 'Navigate',
		test: key('k'),
		when: inDiff,
		run: () => cursorMoveHunk(-1),
		hide: true,
	},
	{
		combo: '1-9',
		desc: 'Go to line (↵ jump, esc cancel)',
		group: 'Navigate',
		test: e =>
			/^[0-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey,
		when: inDiff,
		run: e => golineDigit(e.key),
		goline: true,
	},
	// Goline commit must outrank "comment on line" while digits are pending - same key, same scope.
	{
		combo: '↵',
		desc: 'Jump to typed line',
		group: 'Navigate',
		test: enter,
		when: () => inDiff() && golineActive(),
		run: () => golineCommit(),
		goline: true,
		hide: true,
	},
	// On an oversized placeholder card there is no line to comment on: loads the real diff instead, and being more specific than the plain-↵ comment binding it wins in that one scope.
	{
		combo: '↵',
		desc: 'Load diff anyway (large file)',
		group: 'Review',
		test: enter,
		when: () => inDiff() && isOversizedPlaceholder(),
		run: () => loadOversizedDiff(),
	},
	{
		combo: '↵',
		desc: 'Comment / reply on line',
		group: 'Comment',
		test: enter,
		when: inDiff,
		run: () => cursorComment(),
	},
	{
		combo: 'c',
		desc: 'Comment on line',
		group: 'Comment',
		test: key('c'),
		when: inDiff,
		run: () => cursorComment(),
		hide: true,
	},
	{
		combo: '⇧C',
		desc: 'Comment on file',
		group: 'Comment',
		test: shift('C'),
		when: () => inDiff() && fileCommentsEnabled(),
		run: () => S.toggleFileComposer?.(),
	},
	{
		combo: 'r',
		desc: 'Resolve / reopen thread',
		group: 'Comment',
		test: key('r'),
		when: inDiff,
		run: () => cursorResolve(),
	},
	{
		combo: '⌘↵',
		desc: 'Submit comment (Request change)',
		group: 'Comment',
		test: cmd('Enter'),
		when: inComposer,
		typing: true,
		run: () => S.saveComment?.(),
	},
	{
		combo: '⌘⇧↵',
		desc: 'Submit as question (Ask)',
		group: 'Comment',
		test: cmdShift('Enter'),
		when: () => inComposer() && !S.editingCommentId,
		typing: true,
		run: () => S.ask?.(),
	},
	{
		combo: '⇧Y',
		desc: 'Accept change (Keep)',
		group: 'Review',
		test: shift('Y'),
		when: inDiff,
		run: () => cursorVerdict('accepted'),
	},
	{
		combo: '⇧N',
		desc: 'Reject change (Undo)',
		group: 'Review',
		test: shift('N'),
		when: inDiff,
		run: () => cursorVerdict('rejected'),
	},
	{
		combo: 'v',
		desc: 'Split / Stacked',
		group: 'View',
		test: key('v'),
		when: inDiff,
		run: () => S.setStyle?.(S.diffStyle === 'split' ? 'unified' : 'split'),
	},
	{
		combo: 'm',
		desc: 'Rendered / source (markdown)',
		group: 'View',
		test: key('m'),
		when: isMd,
		run: () =>
			S.setFileView?.(S.fileView === 'rendered' ? 'source' : 'rendered'),
	},
	{
		combo: '⇧E',
		desc: 'Open in editor',
		group: 'View',
		test: shift('E'),
		when: inDiff,
		run: () => void S.openInEditor?.(),
	},
	{
		combo: '⇧A',
		desc: 'Approve / mark file reviewed',
		group: 'Review',
		test: shift('A'),
		when: () =>
			inDiff() && hasCurrentFile(S.state?.files, S.preview, S.fileIndex),
		run: () => void approveCurrentFile(),
	},
]
