import { useId } from 'react'

import { useHubList, useHubMode } from '@entities/hub/use-hubs'
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

// Where the repository has to be: on the hub's machine, and from the web, one the hub already
// serves (use-new-review.ts).
function NewReviewIntro({
	id,
	isRelayed,
}: {
	id: string
	isRelayed: boolean
}): ReactElement {
	return (
		<p id={id} {...stylex.props(newReviewDialog.intro)}>
			{isRelayed
				? 'From the web, the repository has to be one this hub already has a live desk on.'
				: "The repository has to be on this hub's machine."}{' '}
			The desk reads it the way <Code>syneva open</Code> would from inside
			it.
		</p>
	)
}

export function NewReviewDialog({
	roots,
	seed,
	onClose,
}: {
	roots: readonly string[]
	seed: string | null
	onClose: () => void
}): ReactElement {
	const form = useNewReview(seed, useHubList(), useHubMode())
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
					<NewReviewIntro id={introId} isRelayed={form.isRelayed} />
					<NewReviewFields
						form={form}
						roots={roots}
						isSeeded={seed !== null}
					/>
					{form.refusal && <OpenRefusal refusal={form.refusal} />}
				</DialogBody>
				<NewReviewActions isBusy={form.isBusy} onCancel={close} />
			</form>
		</Dialog>
	)
}
