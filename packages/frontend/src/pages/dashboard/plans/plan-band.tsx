import * as stylex from '@stylexjs/stylex'

import { planBand } from './plan-band.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement, ReactNode } from 'react'

type BandProps = {
	as?: 'div' | 'header' | 'section' | undefined
	id?: string | undefined
	labelledBy?: string | undefined
	// Laid over the band and its frame: the head's own spacing, its two columns.
	css?: { band?: Style | undefined; frame?: Style | undefined } | undefined
	children: ReactNode
}

// One band of a plan's page (plan-band.styles.ts): the head, the intro, a section, the raw file.
export function Band({
	as: Tag = 'div',
	id,
	labelledBy,
	css,
	children,
}: BandProps): ReactElement {
	return (
		<Tag
			id={id}
			aria-labelledby={labelledBy}
			{...stylex.props(planBand.band, css?.band)}
		>
			<div {...stylex.props(planBand.frame, css?.frame)}>{children}</div>
		</Tag>
	)
}
