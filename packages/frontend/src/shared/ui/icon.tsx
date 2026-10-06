import * as stylex from '@stylexjs/stylex'

import { icon } from './icon.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

export function Icon({
	id,
	css,
	title,
}: {
	id: string
	css?: Style
	title?: string | undefined
}): ReactElement {
	return (
		<svg {...stylex.props(icon.base, css)} aria-hidden={!title}>
			{title ? <title>{title}</title> : null}
			<use href={`#${id}`} />
		</svg>
	)
}
