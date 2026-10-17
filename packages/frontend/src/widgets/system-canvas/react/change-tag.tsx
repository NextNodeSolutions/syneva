import { CHANGE_WORDS, changeTone } from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import type { ChangeMark } from '@entities/review/guide/model'
import type { StaticStyle } from '@shared/lib/cx'
import type { ReactElement } from 'react'

export function ChangeTag({
	change,
	css,
}: {
	change: ChangeMark | undefined
	css?: StaticStyle
}): ReactElement | null {
	if (!change) return null
	return (
		<span {...stylex.props(tag.base, changeTone[change], css)}>
			{CHANGE_WORDS[change]}
		</span>
	)
}
