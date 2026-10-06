import * as stylex from '@stylexjs/stylex'

import { choiceField } from './choice-field.styles'
import { ChoiceTile } from './choice-tile'
import { fieldParts } from './field-parts.styles'

import type { ReactElement } from 'react'
import type { Choice } from './choice-tile'

type ChoiceFieldProps<T extends string> = {
	legend: string
	name: string
	value: T
	options: readonly Choice<T>[]
	onChange: (choice: T) => void
}

// The chosen tile's look follows `value` (React state), not :has(), so it holds in every engine the hub supports; the radios stay native, so arrow keys and Space still move the choice.
export function ChoiceField<T extends string>({
	legend,
	name,
	value,
	options,
	onChange,
}: ChoiceFieldProps<T>): ReactElement {
	return (
		<fieldset {...stylex.props(choiceField.fieldset)}>
			<legend {...stylex.props(fieldParts.label, choiceField.legend)}>
				{legend}
			</legend>
			<div {...stylex.props(choiceField.grid)}>
				{options.map(option => (
					<ChoiceTile
						key={option.value}
						choice={option}
						name={name}
						isChosen={option.value === value}
						onChoose={onChange}
					/>
				))}
			</div>
		</fieldset>
	)
}
