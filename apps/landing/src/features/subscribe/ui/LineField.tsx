import { useId } from 'react'

import * as stylex from '@stylexjs/stylex'
import { caption, dot } from '@syneva/design-system/controls.styles'

import { fieldText } from './field.styles'
import { reset } from './reset.styles'

import type { ComponentPropsWithRef, ReactElement } from 'react'

type LineFieldProps = {
	label: string
	// Beside the label, e.g. "optional".
	aside?: string | undefined
	problem?: string | undefined
} & Omit<ComponentPropsWithRef<'input'>, 'className' | 'style' | 'id'>

// A labelled line of the sheet; what stops the form shows under it, and the field points at it with aria-describedby.
export function LineField({
	label,
	aside,
	problem,
	...input
}: LineFieldProps): ReactElement {
	const id = useId()
	const problemId = `${id}-problem`
	const isRefused = Boolean(problem)
	return (
		<>
			<label htmlFor={id} {...stylex.props(fieldText.labelRow)}>
				<span {...stylex.props(fieldText.label)}>{label}</span>
				{aside && <span {...stylex.props(caption.base)}>{aside}</span>}
			</label>
			<input
				{...input}
				{...stylex.props(
					reset.border,
					fieldText.input,
					isRefused && fieldText.inputRefused,
				)}
				id={id}
				aria-invalid={isRefused || undefined}
				aria-describedby={isRefused ? problemId : undefined}
			/>
			{isRefused && (
				<p {...stylex.props(fieldText.problem)} id={problemId}>
					<span
						{...stylex.props(dot.base, dot.red)}
						aria-hidden="true"
					/>
					{problem}
				</p>
			)}
		</>
	)
}
