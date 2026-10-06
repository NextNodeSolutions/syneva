import { ChoiceField } from '@shared/ui/choice-field'
import { TextField } from '@shared/ui/text-field'
import * as stylex from '@stylexjs/stylex'

import { needsTarget } from '../use-new-review'

import { newReviewDialog } from './new-review-dialog.styles'
import { NewReviewTarget } from './new-review-target'
import { RepositoryField } from './repository-field'

import type { Choice } from '@shared/ui/choice-tile'
import type { ReactElement } from 'react'
import type { NewReview, Source } from '../use-new-review'

const SOURCES: readonly Choice<Source>[] = [
	{ value: 'working', title: 'Working tree', detail: 'syneva open' },
	{
		value: 'staged',
		title: 'Staged changes',
		detail: 'syneva open --diff staged',
	},
	{
		value: 'pr',
		title: 'Branch or pull request',
		detail: 'syneva open pr <ref>',
	},
	{
		value: 'file',
		title: 'A single file',
		detail: 'syneva open file <path>',
	},
]

// The sources with the chosen one marked for the dialog's first focus.
function focusedOn(source: Source): readonly Choice<Source>[] {
	return SOURCES.map(choice => ({
		...choice,
		isAutofocused: choice.value === source,
	}))
}

// The fields of New review: the repository (suggesting the roots the hub lists or remembers), what to review, the target its source reads, and the session.
// Each input is named after its field, so a failed submit can send focus to it; while the hub opens the desk, they hold still. Opened on a repository (`isSeeded`), focus starts on what to review instead.
export function NewReviewFields({
	form,
	roots,
	isSeeded,
}: {
	form: NewReview
	roots: readonly string[]
	isSeeded: boolean
}): ReactElement {
	const { fields } = form
	return (
		<div {...stylex.props(newReviewDialog.fields)}>
			<RepositoryField
				form={form}
				roots={roots}
				isAutofocused={!isSeeded}
			/>
			<ChoiceField
				legend="What to review"
				name="source"
				value={fields.source}
				options={isSeeded ? focusedOn(fields.source) : SOURCES}
				onChange={form.setSource}
			/>
			{needsTarget(fields.source) && (
				<NewReviewTarget form={form} source={fields.source} />
			)}
			<TextField
				name="session"
				label="Session"
				aside="optional"
				mono
				placeholder="defaults to the branch, file or ref"
				hint="One desk per repository and session. The same source reopens it; another source replaces it, and the old desk closes for its agent."
				value={fields.session}
				readOnly={form.isBusy}
				onChange={event => form.setSession(event.target.value)}
			/>
		</div>
	)
}
