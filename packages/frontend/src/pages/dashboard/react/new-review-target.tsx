import { TextField } from '@shared/ui/text-field'

import type { ReactElement } from 'react'
import type { NewReview } from '../use-new-review'

// The target of the sources that read one: a file (required) or a ref (optional, the
// checked-out branch by default). Each source keeps what was typed for it.
const TARGET = {
	file: {
		label: 'File',
		placeholder: 'docs/plan.md',
		hint: 'Relative to the path above, or absolute. Tracked or not.',
	},
	pr: {
		label: 'Branch, PR number or URL',
		aside: 'optional',
		placeholder: 'feat/login, 128 or a GitHub URL',
		hint: 'Leave it empty to review the checked-out branch. Syneva checks the branch out and refuses while tracked files have uncommitted changes; a number or URL needs gh, signed in.',
	},
} as const

// Shown, without animation, only while the chosen source reads a target.
export function NewReviewTarget({
	form,
	source,
}: {
	form: NewReview
	source: keyof typeof TARGET
}): ReactElement {
	return (
		<TextField
			{...TARGET[source]}
			name="target"
			mono
			required={source === 'file'}
			error={form.errors.target}
			value={form.fields.targets[source]}
			readOnly={form.isBusy}
			onChange={event => form.setTarget(source, event.target.value)}
		/>
	)
}
