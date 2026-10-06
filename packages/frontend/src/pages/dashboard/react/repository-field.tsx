import { useId } from 'react'

import { TextField } from '@shared/ui/text-field'

import type { ReactElement } from 'react'
import type { NewReview } from '../use-new-review'

export function RepositoryField({
	form,
	roots,
	isAutofocused,
}: {
	form: NewReview
	roots: readonly string[]
	isAutofocused: boolean
}): ReactElement {
	const rootsListId = useId()
	return (
		<>
			<TextField
				name="root"
				label="Repository"
				mono
				data-autofocus={isAutofocused || undefined}
				list={rootsListId}
				placeholder="/home/you/projects/app"
				hint="An absolute path inside the repository (or ~/…), on this hub's machine."
				error={form.errors.root}
				value={form.fields.root}
				readOnly={form.isBusy}
				onChange={event => form.setRoot(event.target.value)}
			/>
			<datalist id={rootsListId}>
				{roots.map(root => (
					<option key={root} value={root} />
				))}
			</datalist>
		</>
	)
}
