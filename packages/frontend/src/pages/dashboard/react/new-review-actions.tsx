import { Button } from '@shared/ui/button'
import { DialogFooter } from '@shared/ui/dialog-footer'
import { TextButton } from '@shared/ui/text-button'
import { touchTarget } from '@shared/ui/touch-target.styles'

import { newReviewDialog } from './new-review-dialog.styles'

import type { ReactElement } from 'react'

export function NewReviewActions({
	isBusy,
	onCancel,
}: {
	isBusy: boolean
	onCancel: () => void
}): ReactElement {
	return (
		<DialogFooter>
			<TextButton
				css={[touchTarget.large, newReviewDialog.cancel]}
				onClick={onCancel}
			>
				Cancel
			</TextButton>
			<Button
				type="submit"
				tone="primary"
				size="large"
				arrow
				css={touchTarget.large}
				busy={isBusy}
				busyLabel="Opening…"
			>
				Open the desk
			</Button>
		</DialogFooter>
	)
}
