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
	// The site that took the signup (syneva.dev, dev.syneva.dev, a local dev server): the email's links and images point back at it.
	origin: string
}

// The welcome a new address gets: the site's slogan turned on the signup, then what will be waiting (one review round, what ships), and what the project holds itself to.
export function WelcomeEmail({
	recipient,
	origin,
}: WelcomeEmailProps): ReactElement {
	const copy = WELCOME_COPY
	return (
		<Html lang="en">
			<EmailHead origin={origin} />
			<Preview>{copy.preview}</Preview>
			<Body style={email.body}>
				<Container style={email.container}>
					<EmailHeader origin={origin} caption={copy.caption} />
					<Section style={email.card}>
						<Section style={email.headline}>
							<DiffHeadline
								added={copy.added}
								verdict={copy.verdict}
							/>
						</Section>
						<Text style={email.paragraph}>{copy.body}</Text>
						<Section style={email.section}>
							<ReviewRound />
						</Section>
						<Section style={email.section}>
							<ComingList title={copy.coming} origin={origin} />
						</Section>
						<PrinciplesStrip />
					</Section>
					<EmailFooter recipient={recipient} origin={origin} />
				</Container>
			</Body>
		</Html>
	)
}
