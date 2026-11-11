import * as stylex from '@stylexjs/stylex'

import { keyHint } from '../model/desk-keys'
import { DIFF_STYLES } from '../model/diff-files'

import { layoutSwitch } from './layout-switch.styles'

import type { ReactElement } from 'react'
import type { DiffStyle } from '../model/diff-files'

type LayoutSwitchProps = {
	diffStyle: DiffStyle
	onChoose: (diffStyle: DiffStyle) => void
}

const LAYOUT_LABELS: Readonly<Record<DiffStyle, string>> = {
	split: 'Split',
	unified: 'Stacked',
}

export function LayoutSwitch({
	diffStyle,
	onChoose,
}: LayoutSwitchProps): ReactElement {
	return (
		<div
			role="group"
			aria-label="Diff layout"
			title={keyHint('switch_layout')}
			{...stylex.props(layoutSwitch.group)}
		>
			{DIFF_STYLES.map(style => (
				<button
					key={style}
					type="button"
					aria-pressed={style === diffStyle}
					onClick={() => onChoose(style)}
					{...stylex.props(
						layoutSwitch.option,
						style === diffStyle && layoutSwitch.chosen,
					)}
				>
					{LAYOUT_LABELS[style]}
				</button>
			))}
		</div>
	)
}
