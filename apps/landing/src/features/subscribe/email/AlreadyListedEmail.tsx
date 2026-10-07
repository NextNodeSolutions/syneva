import { Section, Text } from '@react-email/components'

import { ALREADY_LISTED_COPY } from './already-listed-copy'
import { DiffHeadline } from './DiffHeadline'
import { email } from './email.styles'
import { EmailFrame } from './EmailFrame'

import type { ReactElement } from 'react'
import type { ListEmailProps } from '../model/list-email'

// What an address already on the list gets when it signs up again: the welcome's frame and headline, then one paragraph saying nothing changed.
export function AlreadyListedEmail({
	recipient,
	origin,
}: ListEmailProps): ReactElement {
	const { preview, caption, added, verdict, body } = ALREADY_LISTED_COPY
	return (
		<EmailFrame
			recipient={recipient}
			origin={origin}
			preview={preview}
			caption={caption}
		>
			<Section style={email.headline}>
				<DiffHeadline added={added} verdict={verdict} />
			</Section>
			<Text style={email.paragraph}>{body}</Text>
		</EmailFrame>
	)
}
