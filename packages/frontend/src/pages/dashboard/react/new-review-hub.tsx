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

// Which of the person's hubs the desk opens on. Only when there is a choice: with one hub the
// open goes to it and the field would only repeat the page. Offline hubs are listed, so the
// reviewer sees where they are, but cannot be picked: the open would be relayed to nobody.
export function NewReviewHub({
	form,
}: {
	form: NewReview
}): ReactElement | null {
	const now = useNow()
	const noteId = useId()
	if (form.hubs.length <= 1) return null
	return (
		<div>
			<ChoiceField
				legend="Hub"
				name="hub"
				value={form.hubId ?? ''}
				options={form.hubs.map(hub => choiceOf(hub, now))}
				onChange={form.setHub}
			/>
			<FieldNote id={noteId} error={form.errors.hub} />
		</div>
	)
}
