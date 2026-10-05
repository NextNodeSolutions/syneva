import { useId } from 'react'

import { Code } from '@shared/ui/code'
import { Dialog } from '@shared/ui/dialog'
import { DialogBody } from '@shared/ui/dialog-body'
import * as stylex from '@stylexjs/stylex'

import { useNewReview } from '../use-new-review'

import { NewReviewActions } from './new-review-actions'
import { newReviewDialog } from './new-review-dialog.styles'
import { NewReviewFields } from './new-review-fields'
import { OpenRefusal } from './open-refusal'

import type { ReactElement } from 'react'

// "New review": open a desk from the dashboard - the same open the CLI performs, for a
// repository on the hub's machine. Mounted only while open, so every opening starts blank;
// every way out (Cancel, Escape, the cross, the backdrop) abandons an open still in flight.
export function NewReviewDialog({
	roots,
	onClose,
}: {
	// The repositories the hub already lists, suggested in the Repository field.
	roots: readonly string[]
	onClose: () => void
}): ReactElement {
	const form = useNewReview()
	const titleId = useId()
	const introId = useId()
	const close = (): void => {
		form.abort()
		onClose()
	}
	return (
		<Dialog
			open
			caption="New review"
			labelledBy={titleId}
			describedBy={introId}
			onClose={close}
		>
			<form
				noValidate
				onSubmit={form.submit}
				{...stylex.props(newReviewDialog.form)}
			>
				<DialogBody>
					<h2 id={titleId} {...stylex.props(newReviewDialog.title)}>
						Open a desk.
					</h2>
					<p id={introId} {...stylex.props(newReviewDialog.intro)}>
						The repository has to be on this hub&apos;s machine. The
						desk reads it the way <Code>syneva open</Code> would
						from inside it.
					</p>
					<NewReviewFields form={form} roots={roots} />
					{form.refusal && <OpenRefusal refusal={form.refusal} />}
				</DialogBody>
				<NewReviewActions isBusy={form.isBusy} onCancel={close} />
			</form>
		</Dialog>
	)
}
