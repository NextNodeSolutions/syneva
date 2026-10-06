import * as stylex from '@stylexjs/stylex'

import { fieldText } from './field.styles'

import type { ReactElement } from 'react'

// What stops the form, under the field it concerns; the field points at it with aria-describedby.
export function FieldProblem({
	id,
	problem,
}: {
	id: string
	problem: string
}): ReactElement {
	return (
		<p {...stylex.props(fieldText.problem)} id={id}>
			<span
				{...stylex.props(fieldText.problemSquare)}
				aria-hidden="true"
			/>
			{problem}
		</p>
	)
}
