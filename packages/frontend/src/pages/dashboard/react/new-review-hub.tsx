import { useId } from 'react'

import { useNow } from '@shared/lib/use-now'
import { ChoiceField } from '@shared/ui/choice-field'
import { FieldNote } from '@shared/ui/field-note'

import { offlineWords } from '../hub-copy'

import type { HubRef } from '@entities/hub/model'
import type { Choice } from '@shared/ui/choice-tile'
import type { ReactElement } from 'react'
import type { NewReview } from '../use-new-review'

function choiceOf(hub: HubRef, now: number): Choice<string> {
	return {
		value: hub.id,
		title: hub.name,
		detail: hub.isOnline
			? `online${hub.version ? `, syneva ${hub.version}` : ''}`
			: offlineWords(hub, now),
		isDisabled: !hub.isOnline,
	}
}

// Which of the person's hubs the desk opens on, asked when there is a choice or when none of them
// can take the open (use-new-review.ts). Offline hubs are listed, so the reviewer sees where they
// are, but cannot be picked: the open would be relayed to nobody. With every hub offline no radio
// can take the focus a failed submit sends to the first wrong field, so the error is announced as
// it appears.
export function NewReviewHub({
	form,
}: {
	form: NewReview
}): ReactElement | null {
	const now = useNow()
	const noteId = useId()
	if (!form.asksHub) return null
	return (
		<div>
			<ChoiceField
				legend="Hub"
				name="hub"
				value={form.hubId ?? ''}
				options={form.hubs.map(hub => choiceOf(hub, now))}
				onChange={form.setHub}
			/>
			<div role="alert">
				<FieldNote id={noteId} error={form.errors.hub} />
			</div>
		</div>
	)
}
