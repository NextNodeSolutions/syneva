import * as stylex from '@stylexjs/stylex'

import { newReviewDialog } from './new-review-dialog.styles'

import type { ReactElement } from 'react'

const LISTED_LINES = 6

const PORCELAIN = /^(?<code>[ MTADRCU?!]{2}) (?<path>.+)$/

const CODE_WIDTH = 2

function fileLine(line: string): string {
	const parts = PORCELAIN.exec(line)?.groups
	if (!parts?.code || !parts.path) return line
	return `${parts.code.trim().padEnd(CODE_WIDTH)} ${parts.path}`
}

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
