import { useId } from 'react'

import * as stylex from '@stylexjs/stylex'

import { fieldText } from './field.styles'
import { FieldProblem } from './FieldProblem'

import type { ComponentPropsWithRef, ReactElement } from 'react'

type LineFieldProps = {
	label: string
	// Beside the label, e.g. "optional".
	aside?: string | undefined
	problem?: string | undefined
} & Omit<ComponentPropsWithRef<'input'>, 'className' | 'style' | 'id'>

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
				{aside && (
					<span {...stylex.props(fieldText.aside)}>{aside}</span>
				)}
			</label>
			<input
				{...input}
				{...stylex.props(
					fieldText.input,
					isRefused && fieldText.inputRefused,
				)}
				id={id}
				aria-invalid={isRefused || undefined}
				aria-describedby={isRefused ? problemId : undefined}
			/>
			{problem && <FieldProblem id={problemId} problem={problem} />}
		</>
	)
}
