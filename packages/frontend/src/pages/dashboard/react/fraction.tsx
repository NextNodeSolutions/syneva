import { a11y } from '@shared/ui/a11y.styles'
import * as stylex from '@stylexjs/stylex'

import { deskReview } from './desk-review.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

// "3/12" to the eye, "3 of 12" to a screen reader.
export function Fraction({
	count,
	total,
	css,
}: {
	count: number
	total: number
	css?: Style
}): ReactElement {
	return (
		<>
			<span {...stylex.props(deskReview.figure, css)} aria-hidden="true">
				{count}/{total}
			</span>
			<span {...stylex.props(a11y.srOnly)}>
				{count} of {total}
			</span>
		</>
	)
}
