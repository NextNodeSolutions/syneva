import { ChurnCounts } from '@entities/review/ui/ChurnCounts'
import * as stylex from '@stylexjs/stylex'

import { ChangeGlyph } from './ChangeGlyph'
import { fileHeader } from './file-header.styles'

import type { ReactElement, ReactNode } from 'react'
import type { DiffFile } from '../model/diff-files'

type FileHeaderProps = {
	file: DiffFile
	children: ReactNode
}

export function FileHeader({ file, children }: FileHeaderProps): ReactElement {
	const { type, prevName } = file.metadata
	return (
		<header {...stylex.props(fileHeader.bar)}>
			<ChangeGlyph type={type} />
			<h2 {...stylex.props(fileHeader.path)}>{file.path}</h2>
			{prevName && prevName !== file.path && (
				<span {...stylex.props(fileHeader.moved)}>
					moved from {prevName}
				</span>
			)}
			{children}
			<span {...stylex.props(fileHeader.churn)}>
				<ChurnCounts
					additions={file.additions}
					deletions={file.deletions}
				/>
			</span>
		</header>
	)
}
