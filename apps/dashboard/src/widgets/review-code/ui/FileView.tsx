import { useMemo } from 'react'

import { FileDiff } from '@pierre/diffs/react'
import * as stylex from '@stylexjs/stylex'

import { isSplittable } from '../model/diff-files'

import { fileView } from './file-view.styles'
import { FileHeader } from './FileHeader'
import { LayoutSwitch } from './LayoutSwitch'

import type { FileDiffOptions } from '@pierre/diffs/react'
import type { ReactElement } from 'react'
import type { DiffFile, DiffStyle } from '../model/diff-files'

type FileViewProps = {
	file: DiffFile
	diffStyle: DiffStyle
	onLayoutChoose: (diffStyle: DiffStyle) => void
}

const DIFF_OPTIONS = {
	themeType: 'light',
	diffIndicators: 'bars',
	hunkSeparators: 'line-info',
	overflow: 'wrap',
	lineDiffType: 'word-alt',
	disableFileHeader: true,
} as const satisfies FileDiffOptions<undefined, undefined>

export function FileView({
	file,
	diffStyle,
	onLayoutChoose,
}: FileViewProps): ReactElement {
	const canSplit = isSplittable(file)
	const shownStyle = canSplit ? diffStyle : 'unified'
	const options = useMemo(
		() => ({ ...DIFF_OPTIONS, diffStyle: shownStyle }),
		[shownStyle],
	)
	return (
		<section aria-label={file.path} {...stylex.props(fileView.column)}>
			<FileHeader file={file}>
				{canSplit && (
					<LayoutSwitch
						diffStyle={diffStyle}
						onChoose={onLayoutChoose}
					/>
				)}
			</FileHeader>
			<div key={file.path} {...stylex.props(fileView.scroller)}>
				<FileDiff fileDiff={file.metadata} options={options} />
			</div>
		</section>
	)
}
