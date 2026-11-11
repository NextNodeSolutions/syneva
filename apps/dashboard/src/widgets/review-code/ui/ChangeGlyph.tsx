import { Glyph } from '@shared/ui/Glyph'

import { changeGlyph } from './change-glyph.styles'

import type { ChangeTypes } from '@pierre/diffs'
import type { ReactElement } from 'react'

const CHANGE_LABELS: Readonly<Record<ChangeTypes, string>> = {
	new: 'Added',
	deleted: 'Deleted',
	change: 'Modified',
	'rename-pure': 'Renamed',
	'rename-changed': 'Renamed and modified',
}

export function ChangeGlyph({ type }: { type: ChangeTypes }): ReactElement {
	return (
		<Glyph
			name="file"
			label={CHANGE_LABELS[type]}
			css={changeGlyph[type]}
		/>
	)
}
