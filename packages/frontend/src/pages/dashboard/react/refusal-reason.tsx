import * as stylex from '@stylexjs/stylex'

import { newReviewDialog } from './new-review-dialog.styles'

import type { ReactElement } from 'react'

// The most lines of a list the notice shows; the rest is counted.
const LISTED_LINES = 6

// A `git status --porcelain` line: two status columns (index, then worktree), a space, the path.
const PORCELAIN = /^(?<code>[ MTADRCU?!]{2}) (?<path>.+)$/

// The width the trimmed code is padded to: two letters at most.
const CODE_WIDTH = 2

// One file of the list: its status letters trimmed and padded to one cell, so a staged `M ` and
// an unstaged ` M` start at the same column, and every path at the next one. Which of the two
// columns a letter sat in (staged or not) means nothing to the reader here. A line of another
// shape is shown as it came.
function fileLine(line: string): string {
	const parts = PORCELAIN.exec(line)?.groups
	if (!parts?.code || !parts.path) return line
	return `${parts.code.trim().padEnd(CODE_WIDTH)} ${parts.path}`
}

// The hub's reason, as it wrote it: a sentence, then (a pull request refused over a dirty
// tree) one `git status --porcelain` line per file. The sentence reads as prose; the files as
// the mono list they are, one per line, cut to the first few with a count of the rest - the
// sheet stays a sheet, and the reviewer has `git status` for the whole of it.
export function RefusalReason({ reason }: { reason: string }): ReactElement {
	const [sentence = '', ...lines] = reason.split('\n')
	const files = lines.filter(line => line.trim()).map(fileLine)
	const hidden = files.length - LISTED_LINES
	return (
		<>
			{sentence}
			{files.length > 0 && (
				<span {...stylex.props(newReviewDialog.files)}>
					{files.slice(0, LISTED_LINES).join('\n')}
					{hidden > 0 && `\nand ${hidden} more`}
				</span>
			)}
		</>
	)
}
