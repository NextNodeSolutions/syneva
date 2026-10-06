import {
	Body,
	Container,
	Html,
	Preview,
	Section,
	Text,
} from '@react-email/components'

import { ComingList } from './ComingList'
import { DiffHeadline } from './DiffHeadline'
import { email } from './email.styles'
import { EmailFooter } from './EmailFooter'
import { EmailHead } from './EmailHead'
import { EmailHeader } from './EmailHeader'
import { PrinciplesStrip } from './PrinciplesStrip'
import { ReviewRound } from './ReviewRound'
import { WELCOME_COPY } from './welcome-copy'

import type { ReactElement } from 'react'

export type WelcomeEmailProps = {
	recipient: string
	// The site the email's links and images point back at: the deploy's SITE_URL, or the dev server's own origin in the preview.
	origin: string
}

// The welcome a new address gets: the site's slogan turned on the signup, then what will be waiting (one review round, what ships), and what the project holds itself to.
export function WelcomeEmail({
	recipient,
	origin,
}: WelcomeEmailProps): ReactElement {
	const { preview, caption, added, verdict, body, coming } = WELCOME_COPY
	return (
		<Html lang="en">
			<EmailHead origin={origin} />
			<Preview>{preview}</Preview>
			<Body style={email.body}>
				<Container style={email.container}>
					<EmailHeader origin={origin} caption={caption} />
					<Section style={email.card}>
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
					</Section>
					<EmailFooter recipient={recipient} origin={origin} />
				</Container>
			</Body>
		</Html>
	)
}
