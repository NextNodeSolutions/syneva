import { countLabel } from '@shared/lib/count-label'
import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { DIFF_STYLES } from '../model/diff-files'

import { diffToolbar } from './diff-toolbar.styles'

import type { ReactElement } from 'react'
import type { DiffStyle } from '../model/diff-files'

const STYLE_LABELS: Readonly<Record<DiffStyle, string>> = {
	unified: 'Unified',
	split: 'Split',
}

type DiffToolbarProps = {
	fileCount: number
	diffStyle: DiffStyle
	onDiffStyleChange: (diffStyle: DiffStyle) => void
}

export function DiffToolbar({
	fileCount,
	diffStyle,
	onDiffStyleChange,
}: DiffToolbarProps): ReactElement {
	return (
		<div {...stylex.props(diffToolbar.bar)}>
			<span {...stylex.props(caption.base)}>
				{countLabel(fileCount, { one: 'file', other: 'files' })} changed
			</span>
			<div
				role="group"
				aria-label="Diff layout"
				{...stylex.props(diffToolbar.switch)}
			>
				{DIFF_STYLES.map(style => (
					<button
						key={style}
						type="button"
						aria-pressed={style === diffStyle}
						onClick={() => onDiffStyleChange(style)}
						{...stylex.props(
							diffToolbar.option,
							style === diffStyle && diffToolbar.chosen,
						)}
					>
						{STYLE_LABELS[style]}
					</button>
				))}
			</div>
		</div>
	)
}
