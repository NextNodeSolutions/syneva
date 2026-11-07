import { Section, Text } from '@react-email/components'

import { ComingList } from './ComingList'
import { DiffHeadline } from './DiffHeadline'
import { email } from './email.styles'
import { EmailFrame } from './EmailFrame'
import { PrinciplesStrip } from './PrinciplesStrip'
import { ReviewRound } from './ReviewRound'
import { WELCOME_COPY } from './welcome-copy'

import type { ReactElement } from 'react'
import type { ListEmailProps } from '../model/list-email'

// The welcome a new address gets: the site's slogan turned on the signup, then what will be waiting (one review round, what ships), and what the project holds itself to.
export function WelcomeEmail({
	recipient,
	origin,
}: ListEmailProps): ReactElement {
	const { preview, caption, added, verdict, body, coming } = WELCOME_COPY
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
			<Section style={email.section}>
				<ReviewRound />
			</Section>
			<Section style={email.section}>
				<ComingList title={coming} origin={origin} />
			</Section>
			<PrinciplesStrip />
		</EmailFrame>
	)
}
