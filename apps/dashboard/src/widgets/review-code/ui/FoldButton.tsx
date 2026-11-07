import { Glyph } from '@shared/ui/Glyph'
import * as stylex from '@stylexjs/stylex'

import { deskButton } from './desk-button.styles'

import type { ReactElement } from 'react'

type FoldButtonProps = {
	isAnyDirOpen: boolean
	onToggle: () => void
}

export function FoldButton({
	isAnyDirOpen,
	onToggle,
}: FoldButtonProps): ReactElement {
	const label = isAnyDirOpen ? 'Collapse all folders' : 'Expand all folders'
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			onClick={onToggle}
			{...stylex.props(deskButton.quiet, deskButton.mini)}
		>
			<Glyph name={isAnyDirOpen ? 'collapseAll' : 'expandAll'} />
		</button>
	)
}
