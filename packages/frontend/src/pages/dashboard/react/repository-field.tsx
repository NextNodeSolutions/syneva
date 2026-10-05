import { useId } from 'react'

import { TextField } from '@shared/ui/text-field'

import type { ReactElement } from 'react'
import type { NewReview } from '../use-new-review'

// The repository to open, an absolute path on the hub's machine (the hub expands ~ and refuses
// a relative one: its own cwd is no one's); the roots the hub already lists come up as
// suggestions. It takes focus when the dialog opens.
export function RepositoryField({
	form,
	roots,
}: {
	form: NewReview
	roots: readonly string[]
}): ReactElement {
	const rootsListId = useId()
	return (
		<>
			<TextField
				name="root"
				label="Repository"
				mono
				data-autofocus
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
