import { ChurnCounts } from '@entities/review/ui/ChurnCounts'
import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { CHANGE_MARKS } from '../model/diff-files'

import { fileIndex } from './file-index.styles'
import { FilePath } from './FilePath'

import type { ChangeTypes } from '@pierre/diffs'
import type { StyleXStyles } from '@stylexjs/stylex'
import type { ReactElement } from 'react'
import type { DiffFile } from '../model/diff-files'

const MARK_TONES = {
	new: fileIndex.added,
	change: fileIndex.modified,
	deleted: fileIndex.deleted,
	'rename-pure': fileIndex.renamed,
	'rename-changed': fileIndex.renamed,
} satisfies Record<ChangeTypes, StyleXStyles>

export function FileIndex({
	files,
}: {
	files: readonly DiffFile[]
}): ReactElement {
	return (
		<nav aria-label="Changed files" {...stylex.props(fileIndex.index)}>
			<p {...stylex.props(caption.base, caption.upper, fileIndex.label)}>
				Files
			</p>
			<ol {...stylex.props(fileIndex.list)}>
				{files.map(({ anchor, metadata, additions, deletions }) => (
					<li key={anchor}>
						<a
							href={`#${encodeURIComponent(anchor)}`}
							{...stylex.props(fileIndex.entry)}
						>
							<span
								{...stylex.props(
									fileIndex.mark,
									MARK_TONES[metadata.type],
								)}
							>
								{CHANGE_MARKS[metadata.type]}
							</span>
							<FilePath path={metadata.name} />
							<ChurnCounts
								additions={additions}
								deletions={deletions}
							/>
						</a>
					</li>
				))}
			</ol>
		</nav>
	)
}
